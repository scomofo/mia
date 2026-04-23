import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { plans } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { cals, protein } = (await req.json()) as { cals?: number; protein?: number };
  if (typeof cals !== 'number' && typeof protein !== 'number') {
    return NextResponse.json({ error: 'cals or protein required' }, { status: 400 });
  }

  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();
  if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 400 });

  const patch: { caloriesTarget?: number; proteinTarget?: number } = {};
  if (typeof cals === 'number') patch.caloriesTarget = cals;
  if (typeof protein === 'number') patch.proteinTarget = protein;

  db.update(plans).set(patch).where(eq(plans.id, plan.id)).run();

  return NextResponse.json({
    tuning: {
      cals: patch.caloriesTarget ?? plan.caloriesTarget,
      protein: patch.proteinTarget ?? plan.proteinTarget,
    },
  });
}
