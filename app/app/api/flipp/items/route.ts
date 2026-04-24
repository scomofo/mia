import { NextResponse } from 'next/server';
import { fetchFlyerItems, formatItemPrice } from '@/lib/flipp';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idStr = url.searchParams.get('flyerId');
  if (!idStr) return NextResponse.json({ error: 'flyerId required' }, { status: 400 });
  const flyerId = Number(idStr);
  try {
    const raw = await fetchFlyerItems(flyerId);
    const items = raw.map(it => ({
      id: it.id,
      name: it.name,
      brand: it.brand ?? null,
      price: it.price != null ? Number(it.price) : null,
      display: formatItemPrice(it),
      validTo: it.valid_to,
      image: it.cutout_image_url ?? null,
    }));
    return NextResponse.json({ flyerId, count: items.length, items });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
