import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans, recipes, users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Meal = { t: string; name: string; cal?: number; time?: number; kid?: boolean; prep?: boolean; eaten?: boolean };
type Day = { day: string; kid?: boolean; note?: string; meals: Meal[] };
type Answers = Record<string, unknown>;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const { day: dayKey } = (await req.json()) as { day: string };

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const user = db.select().from(users).where(eq(users.id, USER_ID)).get();
  const answers = (user?.rawAnswers ? JSON.parse(user.rawAnswers) : {}) as Answers;

  const days = JSON.parse(plan.daysJson) as Day[];
  const day = days.find(d => d.day === dayKey);
  if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

  const kid = !!day.kid;
  const cals = plan.caloriesTarget ?? 2200;

  const prefs: string[] = [];
  if (answers.loves && Array.isArray(answers.loves) && answers.loves.length) prefs.push(`Loves: ${answers.loves.join(', ')}`);
  if (answers.hates && Array.isArray(answers.hates) && answers.hates.length) prefs.push(`Avoid: ${answers.hates.join(', ')}`);
  if (answers.restrictions && Array.isArray(answers.restrictions) && answers.restrictions.length) prefs.push(`Restrictions: ${answers.restrictions.join(', ')}`);
  if (answers.cooking) prefs.push(`Cooking style: ${answers.cooking}`);
  if (answers.time) prefs.push(`Time budget: ~${answers.time} min`);

  const oldNames = day.meals.map(m => `${m.t}: ${m.name}`).join(', ');
  const note = typeof day.note === 'string' && day.note.trim() ? day.note.trim() : null;

  const userPrompt = `Regenerate a single day in a weekly meal plan.

Day: ${dayKey}
Target: ~${cals} kcal/day split across 4 meals${kid ? ', kids are home' : ', adults only'}
Previous day was: ${oldNames}
${note ? `User note for this day: "${note}"` : ''}

Constraints:
${prefs.join('\n')}

Return ONLY valid JSON:

{
  "day": "${dayKey}",
  "kid": ${kid},
  "meals": [
    {"t": "Breakfast", "name": "...", "cal": 440, "time": 5},
    {"t": "Lunch", "name": "...", "cal": 560, "time": 10},
    {"t": "Dinner", "name": "...", "cal": 640, "time": 25${kid ? ', "kid": true' : ''}},
    {"t": "Snack", "name": "...", "cal": 200}
  ]
}

Rules:
- Meaningfully different from the previous day (don't reshuffle wording).
- Calories sum within 100 of ${cals}.
- Names under 8 words, respecting loves/hates/restrictions.
- Respond with ONLY the JSON object.`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const newDay = JSON.parse(match[0]) as Day;
    newDay.day = dayKey;
    newDay.kid = kid;
    if (note) newDay.note = note;
    if (!newDay.meals || newDay.meals.length !== 4) throw new Error('Expected 4 meals');

    const idx = days.findIndex(d => d.day === dayKey);
    days[idx] = newDay;
    const daysJson = JSON.stringify(days);
    db.update(plans).set({ daysJson }).where(eq(plans.id, plan.id)).run();
    db.delete(recipes)
      .where(and(eq(recipes.planId, plan.id), eq(recipes.dayKey, dayKey)))
      .run();

    return NextResponse.json({ day: newDay, days });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
