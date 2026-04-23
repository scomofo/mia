import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type Day = { day: string; note?: string; meals: unknown[]; [k: string]: unknown };

export async function POST(req: Request) {
  const { day: dayKey, note } = (await req.json()) as { day: string; note: string };

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const days = JSON.parse(plan.daysJson) as Day[];
  const target = days.find(d => d.day === dayKey);
  if (!target) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

  target.note = typeof note === 'string' ? note.slice(0, 300) : '';
  const daysJson = JSON.stringify(days);
  db.update(plans).set({ daysJson }).where(eq(plans.id, plan.id)).run();

  return NextResponse.json({ days });
}
