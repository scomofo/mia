import { NextResponse } from "next/server";
import { db, USER_ID } from "@/lib/db";
import { users, plans, groceryLists, checkins, recipes } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const user = db.select().from(users).where(eq(users.id, USER_ID)).get();
  const plan = db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, USER_ID), eq(plans.active, true)))
    .get();

  if (!user && !plan) return NextResponse.json({ answers: null, plan: null });

  const answers = user?.rawAnswers ? JSON.parse(user.rawAnswers) : null;
  const planOut = plan
    ? {
        id: plan.id,
        promptId: plan.promptId,
        summary: plan.summary,
        days: JSON.parse(plan.daysJson),
        tuning: { cals: plan.caloriesTarget ?? undefined, protein: plan.proteinTarget ?? undefined },
        startedOn: plan.startedOn,
      }
    : null;

  return NextResponse.json({ answers, plan: planOut });
}

export async function DELETE() {
  const planIds = db.select({ id: plans.id }).from(plans).where(eq(plans.userId, USER_ID)).all().map(r => r.id);
  if (planIds.length) {
    db.delete(groceryLists).where(inArray(groceryLists.planId, planIds)).run();
    db.delete(recipes).where(inArray(recipes.planId, planIds)).run();
  }
  db.delete(checkins).where(eq(checkins.userId, USER_ID)).run();
  db.delete(plans).where(eq(plans.userId, USER_ID)).run();
  db.delete(users).where(eq(users.id, USER_ID)).run();
  return NextResponse.json({ ok: true });
}
