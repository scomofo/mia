import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db, USER_ID } from '@/lib/db';
import { checkins } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const rows = db
    .select()
    .from(checkins)
    .where(eq(checkins.userId, USER_ID))
    .orderBy(desc(checkins.date))
    .limit(14)
    .all();
  return NextResponse.json({ checkins: rows });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    weightLb?: number;
    energy?: number;
    adherence?: number;
    cravings?: string;
    noteToMia?: string;
  };
  db.insert(checkins)
    .values({
      id: randomUUID(),
      userId: USER_ID,
      date: new Date(),
      weightLb: body.weightLb ?? null,
      energy: body.energy ?? null,
      adherence: body.adherence ?? null,
      cravings: body.cravings ?? null,
      noteToMia: body.noteToMia ?? null,
    })
    .run();
  return NextResponse.json({ ok: true });
}
