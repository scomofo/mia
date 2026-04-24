import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, groceryLists } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { fetchFlyers, fetchFlyerItems } from '@/lib/flipp';
import { logUsage } from '@/lib/log-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_POSTAL = process.env.MIA_POSTAL_CODE || 'T4V4Y3';

const FOOD_MERCHANTS = new Set([
  'Co-op', 'Real Canadian Superstore', 'Safeway', 'Save-On-Foods',
  'No Frills', 'FreshCo', 'Sobeys', 'IGA', 'Loblaws', 'Walmart',
  'M&M Food Market', 'Bulk Barn',
]);

async function fetchDealContext(postalCode: string, maxItemsPerFlyer = 40): Promise<string> {
  try {
    const flyers = await fetchFlyers(postalCode);
    const now = Date.now();
    const relevant = flyers
      .filter(f => FOOD_MERCHANTS.has(f.merchant))
      .filter(f => !f.valid_to || new Date(f.valid_to).getTime() >= now)
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

type Offer = { kind: 'pc' | 'coop' | 'sale'; label: string; save: string };
type Item = { name: string; qty: string; offer?: Offer };
type Category = { cat: string; items: Item[] };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  let postalOverride: string | undefined;
  try { postalOverride = (await req.json())?.postalCode; } catch {}

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const cached = db.select().from(groceryLists).where(eq(groceryLists.planId, plan.id)).get();
  if (!cached) return NextResponse.json({ error: 'No grocery list yet' }, { status: 400 });

  const categories = JSON.parse(cached.categoriesJson) as Category[];
  // Strip existing offers so Claude sees a clean slate
  const stripped: Category[] = categories.map(c => ({
    cat: c.cat,
    items: c.items.map(({ name, qty }) => ({ name, qty })),
  }));

  const deals = await fetchDealContext(postalOverride || DEFAULT_POSTAL);
  if (!deals) {
    // Nothing to match against — just clear offers and persist
    db.update(groceryLists)
      .set({ categoriesJson: JSON.stringify(stripped), createdAt: new Date() })
      .where(eq(groceryLists.planId, plan.id))
      .run();
    return NextResponse.json({ categories: stripped, matched: 0, reason: 'no flyers available' });
  }

  const userPrompt = `You are matching a shopping list against this week's store flyers. For each item in the list, attach an "offer" object only if there's a genuine matching deal. If no match, omit the offer field entirely.

SHOPPING LIST (preserve order, names, qty exactly):
${JSON.stringify(stripped, null, 2)}

REAL FLYER DEALS (use these verbatim — do NOT invent prices):

${deals}

Return ONLY valid JSON in this shape — same categories, same item names, same qty, only the "offer" field changes:

{
  "categories": [
    {
      "cat": "Produce",
      "items": [
        {"name": "...", "qty": "...", "offer": {"kind": "coop", "label": "Co-op $4.99/lb", "save": "$1.00"}},
        {"name": "...", "qty": "..."}
      ]
    }
  ]
}

Rules:
- "kind": "coop" for Co-op, "pc" for Real Canadian Superstore, "sale" for anything else.
- "label": short "Merchant $price" or "Brand $price" from the deals block, verbatim.
- "save": conservative per-unit savings vs typical full price, or "$0" if unknown.
- Only attach offers for genuine matches — it's better to omit than to invent.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const t0 = Date.now();
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: userPrompt }],
    });
    logUsage('refresh-deals', resp.usage, Date.now() - t0);

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const payload = JSON.parse(match[0]) as { categories: Category[] };
    if (!payload.categories?.length) throw new Error('No categories');

    const matched = payload.categories.reduce(
      (s, c) => s + c.items.filter(i => i.offer).length,
      0,
    );

    db.update(groceryLists)
      .set({ categoriesJson: JSON.stringify(payload.categories), createdAt: new Date() })
      .where(eq(groceryLists.planId, plan.id))
      .run();

    return NextResponse.json({ categories: payload.categories, matched });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
