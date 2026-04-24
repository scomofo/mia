import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { logUsage } from '@/lib/log-usage';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, recipes } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { searchMealPhoto } from '@/lib/pexels';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Meal = { t: string; name: string; cal?: number; time?: number; prep?: boolean };
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
      photoUrl: cached.photoUrl ?? null,
      photoCredit: cached.photoCredit ?? null,
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

  // Pull surrounding meals so a batch session can reference what it's prepping.
  const allDays = JSON.parse(plan.daysJson) as Array<{ day: string; meals: Meal[] }>;
  const weekMeals = allDays.flatMap(d => d.meals.filter(m => !m.prep).map(m => `${d.day} ${m.t}: ${m.name}`));

  const userPrompt = meal.prep
    ? `You are a meal-prep coach writing a Sunday batch-cook playbook for a ~${meal.time ?? 150} minute session.

This batch session feeds the following week of meals (so the batches should realistically serve these):

${weekMeals.join('\n')}

Return ONLY valid JSON, no prose:

{
  "ingredients": [
    {"qty": "2 lb", "name": "Chicken breast"},
    {"qty": "1 lb", "name": "Jasmine rice"}
  ],
  "steps": [
    "0:00 — Preheat oven to 425F. Start rice on stovetop.",
    "0:10 — Season chicken, roast 25 min while chopping veg.",
    "0:35 — Roast sheet-pan veg for 20 min."
  ]
}

Rules:
- 6–12 ingredients sized for ~4 meals' worth of batches (proteins, grains, sauces, chopped veg).
- 6–10 timeline-style steps. Prefix each with "MM:MM —" so the reader can run simultaneous oven + stovetop work.
- Emphasize batching (sheet-pan multiple proteins, double the rice, one big sauce).
- Include container/reheat guidance in the final 1–2 steps.
- Respond with ONLY the JSON object.`
    : `You are a practical home-cooking coach. Write a recipe for this meal:

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
    const t0 = Date.now();
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
    });
    logUsage('generate-recipe', resp.usage, Date.now() - t0);

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const payload = JSON.parse(match[0]) as { ingredients: Ingredient[]; steps: string[] };

    // Fetch a matching photo in parallel-ish — best effort, never blocks on failure
    const photo = await searchMealPhoto(meal.name);

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
        photoUrl: photo?.url ?? null,
        photoCredit: photo?.credit ?? null,
        createdAt: new Date(),
      })
      .run();

    return NextResponse.json({
      recipe: {
        mealName: meal.name,
        ingredients: payload.ingredients,
        steps: payload.steps,
        photoUrl: photo?.url ?? null,
        photoCredit: photo?.credit ?? null,
      },
      meal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
