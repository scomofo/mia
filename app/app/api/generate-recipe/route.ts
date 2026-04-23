import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, recipes } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Meal = { t: string; name: string; cal?: number; time?: number };
type Day = { day: string; meals: Meal[] };
type Ingredient = { qty: string; name: string };

function activePlan() {
  return db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
}

function findMeal(plan: { daysJson: string }, dayKey: string, idx: number): Meal | null {
  const days = JSON.parse(plan.daysJson) as Day[];
  return days.find(d => d.day === dayKey)?.meals?.[idx] ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dayKey = url.searchParams.get('day');
  const idxStr = url.searchParams.get('idx');
  if (!dayKey || idxStr == null) return NextResponse.json({ error: 'day + idx required' }, { status: 400 });
  const idx = Number(idxStr);

  const plan = activePlan();
  if (!plan) return NextResponse.json({ recipe: null });

  const meal = findMeal(plan, dayKey, idx);
  const cached = db
    .select()
    .from(recipes)
    .where(and(eq(recipes.planId, plan.id), eq(recipes.dayKey, dayKey), eq(recipes.mealIdx, idx)))
    .get();

  if (!cached) return NextResponse.json({ recipe: null, meal });

  return NextResponse.json({
    recipe: {
      mealName: cached.mealName,
      ingredients: JSON.parse(cached.ingredientsJson) as Ingredient[],
      steps: JSON.parse(cached.stepsJson) as string[],
    },
    meal,
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const { day: dayKey, idx } = (await req.json()) as { day: string; idx: number };

  const plan = activePlan();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const meal = findMeal(plan, dayKey, idx);
  if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });

  const userPrompt = `You are a practical home-cooking coach. Write a recipe for this meal:

"${meal.name}" — ${meal.t}, ~${meal.cal ?? 'moderate'} kcal, ${meal.time ?? 15} minutes total.

Return ONLY valid JSON, no prose:

{
  "ingredients": [
    {"qty": "1 cup", "name": "Rolled oats"},
    {"qty": "1 tbsp", "name": "Chia seeds"}
  ],
  "steps": [
    "In a large bowl, combine ...",
    "Stir and refrigerate for 6 hours or overnight."
  ]
}

Rules:
- 4–8 ingredients. Use home-cook quantities ("1 cup", "2 tbsp", "1 lb", "3 cloves"). Metric OK in parentheses.
- 3–6 steps. Each is a complete instruction, under 25 words.
- Skip salt/pepper unless critical. Keep it approachable.
- Match the meal name closely — if it says "sheet pan meatballs", make sheet pan meatballs.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const payload = JSON.parse(match[0]) as { ingredients: Ingredient[]; steps: string[] };

    db.delete(recipes)
      .where(and(eq(recipes.planId, plan.id), eq(recipes.dayKey, dayKey), eq(recipes.mealIdx, idx)))
      .run();
    db.insert(recipes)
      .values({
        id: randomUUID(),
        planId: plan.id,
        dayKey,
        mealIdx: idx,
        mealName: meal.name,
        ingredientsJson: JSON.stringify(payload.ingredients),
        stepsJson: JSON.stringify(payload.steps),
        createdAt: new Date(),
      })
      .run();

    return NextResponse.json({
      recipe: { mealName: meal.name, ingredients: payload.ingredients, steps: payload.steps },
      meal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
