import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, groceryLists } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

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

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const days = JSON.parse(plan.daysJson) as Array<{ day: string; meals: Array<{ t: string; name: string }> }>;
  const mealList = days
    .flatMap(d => d.meals.map(m => `${d.day} ${m.t}: ${m.name}`))
    .join('\n');

  const userPrompt = `You are a pragmatic Canadian grocery planner. Build a shopping list for one week based on these 28 meals for a household in Camrose, Alberta (shops at Real Canadian Superstore with PC Optimum, and Camrose Co-op):

${mealList}

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
- Include 3–6 "offer" objects total across the list, realistic for RCSS/Co-op — mix kinds: "pc" (PC Optimum points), "coop" (Co-op member price), "sale" (flyer/generic sale). Save values under $5 each.
- estimated_cad is total grocery cost in CAD, realistic for a week of 28 meals.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: userPrompt }],
    });

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
