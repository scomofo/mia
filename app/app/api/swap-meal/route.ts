import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans, recipes, users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Meal = { t: string; name: string; cal?: number; time?: number; kid?: boolean; eaten?: boolean };
type Day = { day: string; kid?: boolean; meals: Meal[] };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const { day: dayKey, idx } = (await req.json()) as { day: string; idx: number };

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const user = db.select().from(users).where(eq(users.id, USER_ID)).get();
  const answers = user?.rawAnswers ? JSON.parse(user.rawAnswers) : {};

  const days = JSON.parse(plan.daysJson) as Day[];
  const day = days.find(d => d.day === dayKey);
  if (!day || !day.meals[idx]) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  const old = day.meals[idx];

  const prefs: string[] = [];
  if (answers.loves?.length) prefs.push(`Loves: ${answers.loves.join(', ')}`);
  if (answers.hates?.length) prefs.push(`Avoid: ${answers.hates.join(', ')}`);
  if (answers.restrictions?.length) prefs.push(`Restrictions: ${answers.restrictions.join(', ')}`);
  if (answers.cooking) prefs.push(`Cooking style: ${answers.cooking}`);
  if (answers.time) prefs.push(`Time budget: ~${answers.time} min`);

  const userPrompt = `Replace this meal with a different one:

Old meal: "${old.name}" (${old.t}, ~${old.cal ?? 'moderate'} kcal, ${old.time ?? 15} min${old.kid ? ', kid-friendly' : ''})

Constraints:
${prefs.join('\n')}

Return ONLY valid JSON, no prose:

{"t": "${old.t}", "name": "New meal name", "cal": ${old.cal ?? 500}, "time": ${old.time ?? 15}${old.kid ? ', "kid": true' : ''}}

Rules:
- Different enough from "${old.name}" (not just a re-worded variant).
- Same meal slot (${old.t}).
- Within ±50 kcal and ±10 min of the old meal.
- Keep name under 8 words.
- Respect loves/hates/restrictions.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const replacement = JSON.parse(match[0]) as Meal;
    replacement.t = old.t;
    replacement.eaten = false;

    day.meals[idx] = replacement;
    const daysJson = JSON.stringify(days);
    db.update(plans).set({ daysJson }).where(eq(plans.id, plan.id)).run();
    db.delete(recipes)
      .where(and(eq(recipes.planId, plan.id), eq(recipes.dayKey, dayKey), eq(recipes.mealIdx, idx)))
      .run();

    return NextResponse.json({ meal: replacement, days });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
