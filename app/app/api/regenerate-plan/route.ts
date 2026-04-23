import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { logUsage } from '@/lib/log-usage';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { plans, users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { PROMPTS } from '@/components/data/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Answers = Record<string, unknown> & {
  body?: { sex?: string; h?: string; w?: number };
  age?: number;
  restrictions?: string[];
  loves?: string[];
  hates?: string[];
  pain?: string[];
};

function buildProfile(a: Answers, cals?: number | null, protein?: number | null): string {
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
  if (cals) L.push(`Calorie target: ${cals} kcal/day`);
  if (protein) L.push(`Protein target: ${protein} g/day`);
  L.push(`Location: Camrose, AB, Canada (shops at Real Canadian Superstore + Camrose Co-op)`);
  return L.join('\n');
}

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const user = db.select().from(users).where(eq(users.id, USER_ID)).get();
  if (!user?.rawAnswers) return NextResponse.json({ error: 'No profile' }, { status: 400 });
  const answers = JSON.parse(user.rawAnswers) as Answers;

  const oldPlan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!oldPlan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const prompt = PROMPTS.find(p => p.id === oldPlan.promptId);
  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 400 });

  const profile = buildProfile(answers, oldPlan.caloriesTarget, oldPlan.proteinTarget);
  const userPrompt = `You are a senior nutrition coach (Nav Toor style prompt: "${prompt.title}").

USER PROFILE:
${profile}

Generate a fresh 7-day meal plan for the upcoming week. This is a REGENERATION — previous plan was "${oldPlan.summary ?? 'not summarized'}". Make this week meaningfully different from the last.

Return ONLY valid JSON (no prose, no markdown):

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
- Meals reflect loves/hates/restrictions
- Keep names short (max 8 words)
- Respond with ONLY the JSON object, no other text`;

  try {
    const client = new Anthropic({ apiKey });
    const t0 = Date.now();
    const _t0 = Date.now();
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
    });
    logUsage('regenerate-plan', resp.usage, Date.now() - _t0);

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const plan = JSON.parse(match[0]) as { summary?: string; days: unknown[] };

    db.update(plans).set({ active: false }).where(eq(plans.userId, USER_ID)).run();
    db.insert(plans)
      .values({
        id: randomUUID(),
        userId: USER_ID,
        promptId: oldPlan.promptId,
        caloriesTarget: oldPlan.caloriesTarget,
        proteinTarget: oldPlan.proteinTarget,
        summary: plan.summary ?? null,
        daysJson: JSON.stringify(plan.days),
        startedOn: new Date(),
        active: true,
      })
      .run();

    return NextResponse.json({ summary: plan.summary, days: plan.days, startedOn: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
