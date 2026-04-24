import { NextResponse } from 'next/server';
import { fetchFlyers } from '@/lib/flipp';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const postal = url.searchParams.get('postal') || 'T4V4Y3'; // Camrose default
  try {
    const all = await fetchFlyers(postal.replace(/\s+/g, ''));
    // Trim to what we care about
    const flyers = all.map(f => ({
      id: f.id,
      merchant: f.merchant,
      name: f.name,
      validFrom: f.valid_from,
      validTo: f.valid_to,
      thumbnail: f.thumbnail_url,
    }));
    return NextResponse.json({ postal, count: flyers.length, flyers });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
