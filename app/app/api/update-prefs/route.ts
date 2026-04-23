import { NextResponse } from 'next/server';
import { db, USER_ID } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const patch = (await req.json()) as {
    loves?: string[];
    hates?: string[];
    restrictions?: string[];
  };

  const user = db.select().from(users).where(eq(users.id, USER_ID)).get();
  if (!user) return NextResponse.json({ error: 'No user' }, { status: 400 });

  const raw = user.rawAnswers ? JSON.parse(user.rawAnswers) : {};
  if (patch.loves) raw.loves = patch.loves;
  if (patch.hates) raw.hates = patch.hates;
  if (patch.restrictions) raw.restrictions = patch.restrictions;

  db.update(users)
    .set({
      loves: patch.loves ? JSON.stringify(patch.loves) : user.loves,
      hates: patch.hates ? JSON.stringify(patch.hates) : user.hates,
      restrictions: patch.restrictions ? JSON.stringify(patch.restrictions) : user.restrictions,
      rawAnswers: JSON.stringify(raw),
    })
    .where(eq(users.id, USER_ID))
    .run();

  return NextResponse.json({ answers: raw });
}
