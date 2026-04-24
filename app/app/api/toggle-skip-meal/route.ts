import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type Meal = { t: string; name: string; skipped?: boolean; [k: string]: unknown };
type Day = { day: string; meals: Meal[]; [k: string]: unknown };

export async function POST(req: Request) {
  const { day: dayKey, idx, skipped } = (await req.json()) as {
    day: string; idx: number; skipped?: boolean;
  };

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const days = JSON.parse(plan.daysJson) as Day[];
  const day = days.find(d => d.day === dayKey);
  if (!day || !day.meals[idx]) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });

  day.meals[idx].skipped = typeof skipped === 'boolean' ? skipped : !day.meals[idx].skipped;
  db.update(plans).set({ daysJson: JSON.stringify(days) }).where(eq(plans.id, plan.id)).run();

  return NextResponse.json({ days });
}
