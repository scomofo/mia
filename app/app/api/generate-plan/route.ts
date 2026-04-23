import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { users, plans } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logUsage } from '@/lib/log-usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

function persist(answers: Answers, prompt: Prompt, tuning: Tuning, plan: { summary?: string; days: unknown[] }) {
  const now = new Date();
  const weightKg = answers.body?.w ? Math.round((answers.body.w / 2.2046) * 10) / 10 : null;

  db.insert(users)
    .values({
      id: USER_ID,
      age: answers.age ?? null,
      sex: answers.body?.sex ?? null,
      weightKg,
      activity: typeof answers.activity === 'string' ? answers.activity : null,
      goal: typeof answers.goal === 'string' ? answers.goal : null,
      household: typeof answers.household === 'string' ? answers.household : null,
      weekPattern: typeof answers.pattern === 'string' ? answers.pattern : null,
      cookingStyle: typeof answers.cooking === 'string' ? answers.cooking : null,
      timePerMealMin: typeof answers.time === 'number' ? answers.time : null,
      restrictions: answers.restrictions ? JSON.stringify(answers.restrictions) : null,
      loves: answers.loves ? JSON.stringify(answers.loves) : null,
      hates: answers.hates ? JSON.stringify(answers.hates) : null,
      rawAnswers: JSON.stringify(answers),
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        age: answers.age ?? null,
        sex: answers.body?.sex ?? null,
        weightKg,
        activity: typeof answers.activity === 'string' ? answers.activity : null,
        goal: typeof answers.goal === 'string' ? answers.goal : null,
        household: typeof answers.household === 'string' ? answers.household : null,
        weekPattern: typeof answers.pattern === 'string' ? answers.pattern : null,
        cookingStyle: typeof answers.cooking === 'string' ? answers.cooking : null,
        timePerMealMin: typeof answers.time === 'number' ? answers.time : null,
        restrictions: answers.restrictions ? JSON.stringify(answers.restrictions) : null,
        loves: answers.loves ? JSON.stringify(answers.loves) : null,
        hates: answers.hates ? JSON.stringify(answers.hates) : null,
        rawAnswers: JSON.stringify(answers),
      },
    })
    .run();

  db.update(plans).set({ active: false }).where(eq(plans.userId, USER_ID)).run();
  db.insert(plans)
    .values({
      id: randomUUID(),
      userId: USER_ID,
      promptId: prompt.id,
      caloriesTarget: tuning.cals ?? null,
      proteinTarget: tuning.protein ?? null,
      summary: plan.summary ?? null,
      daysJson: JSON.stringify(plan.days),
      startedOn: now,
      active: true,
    })
    .run();
}

type Answers = Record<string, unknown> & {
  body?: { sex?: string; h?: string; w?: number };
  age?: number;
  restrictions?: string[];
  loves?: string[];
  hates?: string[];
  pain?: string[];
};
type Tuning = { cals?: number; protein?: number };
type Prompt = { id: string; title: string };

function buildProfile(a: Answers, t: Tuning): string {
  const L: string[] = [];
  if (a.age) L.push(`Age: ${a.age}`);
  if (a.body) L.push(`Sex: ${a.body.sex}, ${a.body.h}, ${a.body.w} lb`);
  if (a.activity) L.push(`Activity: ${a.activity}`);
  if (a.goal) L.push(`Goal: ${a.goal}`);
  if (a.household) L.push(`Household: ${a.household}`);
  if (a.pattern) L.push(`Week pattern: ${a.pattern}`);
  if (a.kids && a.kids !== 'no-kids') L.push(`Kids: ${a.kids}`);
  if (a.cooking) L.push(`Cooking style: ${a.cooking}`);
  if (a.time) L.push(`Time per meal: ${a.time} min`);
  if (a.restrictions?.length) L.push(`Restrictions: ${a.restrictions.join(', ')}`);
  if (a.loves?.length) L.push(`Loves: ${a.loves.join(', ')}`);
  if (a.hates?.length) L.push(`Hard no: ${a.hates.join(', ')}`);
  if (a.pain?.length) L.push(`Pain points: ${a.pain.join(', ')}`);
  if (a.budget) L.push(`Budget: ${a.budget}`);
  if (t?.cals) L.push(`Calorie target: ${t.cals} kcal/day`);
  if (t?.protein) L.push(`Protein target: ${t.protein} g/day`);
  L.push(`Location: Camrose, AB, Canada (shops at Real Canadian Superstore + Camrose Co-op)`);
  return L.join('\n');
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const { answers, prompt, tuning } = (await req.json()) as {
    answers: Answers;
    prompt: Prompt;
    tuning: Tuning;
  };

  const profile = buildProfile(answers, tuning);
  const userPrompt = `You are a senior nutrition coach (Nav Toor style prompt: "${prompt.title}").

USER PROFILE:
${profile}

Generate a 7-day meal plan tailored to this person. Return ONLY valid JSON (no prose, no markdown) in this exact shape:

{
  "summary": "One-sentence plan description (max 12 words)",
  "days": [
    {
      "day": "MON",
      "kid": true,
      "meals": [
        {"t": "Breakfast", "name": "Meal name", "cal": 450, "time": 8},
        {"t": "Lunch", "name": "Meal name", "cal": 560, "time": 5},
        {"t": "Dinner", "name": "Meal name", "cal": 640, "time": 30, "kid": true},
        {"t": "Snack", "name": "Meal name", "cal": 200}
      ]
    }
  ]
}

Rules:
- Exactly 7 days: MON, TUE, WED, THU, FRI, SAT, SUN
- Each day has 4 meals (Breakfast, Lunch, Dinner, Snack)
- "kid": true on days the kids are home (respect household pattern)
- Hit calorie target ±100 kcal/day
- Include at least one Sunday batch-cook meal with "prep": true if the prompt is batch-cooking style
- Meals should actually reflect the user's loves/hates and restrictions
- Keep names short (max 8 words)
- Respond with ONLY the JSON object, no other text`;

  try {
    const client = new Anthropic({ apiKey });
    const t0 = Date.now();
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
    });
    logUsage('generate-plan', resp.usage, Date.now() - t0);

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const plan = JSON.parse(match[0]);
    try { persist(answers, prompt, tuning, plan); } catch (e) { console.warn('plan persist failed:', e); }
    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
