import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { logUsage } from '@/lib/log-usage';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, groceryLists } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { fetchFlyers, fetchFlyerItems } from '@/lib/flipp';

const DEFAULT_POSTAL = process.env.MIA_POSTAL_CODE || 'T4V4Y3';

// Food/grocery merchants Flipp surfaces for the T4V region. Anything else
// (pharmacy, home centre, liquor, electronics) won't help a grocery list.
const FOOD_MERCHANTS = new Set([
  'Co-op',
  'Real Canadian Superstore',
  'Safeway',
  'Save-On-Foods',
  'No Frills',
  'FreshCo',
  'Sobeys',
  'IGA',
  'Loblaws',
  'Walmart',
  'M&M Food Market',
  'Bulk Barn',
]);

async function fetchDealContext(postalCode: string, maxItemsPerFlyer = 40): Promise<string> {
  try {
    const flyers = await fetchFlyers(postalCode);
    const now = Date.now();
    const relevant = flyers
      .filter(f => FOOD_MERCHANTS.has(f.merchant))
      .filter(f => !f.valid_to || new Date(f.valid_to).getTime() >= now)
      // prefer the freshest-valid flyers first
      .sort((a, b) => (a.valid_to || '').localeCompare(b.valid_to || ''))
      .slice(0, 3);
    if (!relevant.length) return '';

    const blocks: string[] = [];
    for (const f of relevant) {
      try {
        const items = await fetchFlyerItems(f.id);
        const priced = items.filter(i => i.price != null).slice(0, maxItemsPerFlyer);
        if (!priced.length) continue;
        const lines = priced.map(it => {
          const brand = it.brand ? `${it.brand} ` : '';
          const until = it.valid_to ? ` (til ${it.valid_to.slice(5, 10)})` : '';
          return `  ${brand}${it.name} — $${it.price}${until}`;
        });
        blocks.push(`${f.merchant}:\n${lines.join('\n')}`);
      } catch (e) {
        console.warn(`flipp items ${f.id}:`, e);
      }
    }
    return blocks.join('\n\n');
  } catch (e) {
    console.warn('flipp flyers fetch failed:', e);
    return '';
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;

type Offer = { kind: 'pc' | 'coop' | 'sale'; label: string; save: string };
type Item = { name: string; qty: string; done?: boolean; offer?: Offer };
type Category = { cat: string; items: Item[] };
type GroceryPayload = { categories: Category[]; estimated_cad?: number };

export async function GET() {
  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ categories: null });

  const cached = db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.planId, plan.id))
    .get();
  if (!cached) return NextResponse.json({ categories: null, planId: plan.id });

  return NextResponse.json({
    categories: JSON.parse(cached.categoriesJson) as Category[],
    estimatedCad: cached.estimatedCad,
    planId: plan.id,
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  let postalOverride: string | undefined;
  try {
    const body = await req.json();
    postalOverride = typeof body?.postalCode === 'string' ? body.postalCode : undefined;
  } catch { /* empty body ok */ }

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const days = JSON.parse(plan.daysJson) as Array<{ day: string; skipped?: boolean; meals: Array<{ t: string; name: string; skipped?: boolean }> }>;
  const mealList = days
    .filter(d => !d.skipped)
    .flatMap(d => d.meals.filter(m => !m.skipped).map(m => `${d.day} ${m.t}: ${m.name}`))
    .join('\n');

  const deals = await fetchDealContext(postalOverride || DEFAULT_POSTAL);
  const dealsBlock = deals
    ? `\n\nREAL FLYER DEALS THIS WEEK (use these verbatim for any "offer" entries that match your list — do NOT invent prices for these merchants; only reference items actually in this list):\n\n${deals}`
    : '';

  const userPrompt = `You are a pragmatic Canadian grocery planner. Build a shopping list for one week based on these 28 meals for a household in Camrose, Alberta (shops at Real Canadian Superstore with PC Optimum, and Camrose Co-op):

${mealList}${dealsBlock}

Return ONLY valid JSON, no prose:

{
  "estimated_cad": 87.40,
  "categories": [
    {
      "cat": "Produce",
      "items": [
        {"name": "Avocados", "qty": "4", "offer": {"kind": "sale", "label": "2/$5 at Sobeys", "save": "$1.20"}},
        {"name": "Spinach", "qty": "2 bags"}
      ]
    }
  ]
}

Rules:
- Categories: Produce, Protein, Pantry, Dairy, Frozen, Other — omit any that are empty.
- Consolidate duplicates (if 3 meals use chicken breast, list it once with combined quantity).
- Skip staples most kitchens have (salt, pepper, olive oil unless specifically needed).
- "qty" is short: "3 lb", "1 pack", "2 dozen", etc.
- "offer" rules:
  - If the shopping-list item matches something in REAL FLYER DEALS above, create an "offer" entry using that exact merchant + price. Set "kind" to "coop" for Co-op, "pc" for Real Canadian Superstore, otherwise "sale".
  - If nothing matches, omit the offer — don't fabricate one. Inventing a price you can't see in the deals block is worse than no offer.
  - "label" is short: "Co-op $4.99/lb", "PC Optimum \$5.99 til 05-06", etc.
  - "save" is the per-unit savings vs a reasonable full price — leave as "$0" if unknown.
- estimated_cad is total grocery cost in CAD, realistic for a week of 28 meals.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const t0 = Date.now();
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: userPrompt }],
    });
    logUsage('generate-grocery', resp.usage, Date.now() - t0);

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const payload = JSON.parse(match[0]) as GroceryPayload;
    if (!payload.categories?.length) throw new Error('No categories');

    db.delete(groceryLists).where(eq(groceryLists.planId, plan.id)).run();
    db.insert(groceryLists)
      .values({
        id: randomUUID(),
        planId: plan.id,
        categoriesJson: JSON.stringify(payload.categories),
        estimatedCad: payload.estimated_cad ?? null,
        createdAt: new Date(),
      })
      .run();

    return NextResponse.json({
      categories: payload.categories,
      estimatedCad: payload.estimated_cad,
      planId: plan.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
