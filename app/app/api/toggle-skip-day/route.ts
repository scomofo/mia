import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type Day = { day: string; skipped?: boolean; meals: unknown[]; [k: string]: unknown };

export async function POST(req: Request) {
  const { day: dayKey } = (await req.json()) as { day: string };
  const plan = db.select().from(plans).where(and(eq(plans.userId, USER_ID), eq(plans.active, true))).get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });
  const days = JSON.parse(plan.daysJson) as Day[];
  const d = days.find(x => x.day === dayKey);
  if (!d) return NextResponse.json({ error: 'Day not found' }, { status: 404 });
  d.skipped = !d.skipped;
  db.update(plans).set({ daysJson: JSON.stringify(days) }).where(eq(plans.id, plan.id)).run();
  return NextResponse.json({ days });
}
