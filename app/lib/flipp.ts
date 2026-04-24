// Unofficial Flipp flyer feed — no auth required.
// Docs derived from community scrapers; endpoints may change without notice.

const BASE = 'https://flyers-ng.flippback.com/api/flipp';

export function sid() {
  let s = '';
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export type FlippFlyer = {
  id: number;
  merchant_id: number;
  merchant: string;
  name?: string;
  flyer_type_id?: number;
  valid_from?: string;
  valid_to?: string;
  premium?: boolean;
  thumbnail_url?: string;
  categories?: string[];
};

export type FlippItem = {
  id: number;
  flyer_id: number;
  name: string;
  brand?: string;
  price?: string | number;
  valid_from?: string;
  valid_to?: string;
  cutout_image_url?: string;
};

export async function fetchFlyers(postalCode: string): Promise<FlippFlyer[]> {
  const url = `${BASE}/data?locale=en&postal_code=${encodeURIComponent(postalCode)}&sid=${sid()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Flipp flyers ${res.status}`);
  const data = (await res.json()) as { flyers?: FlippFlyer[] };
  return data.flyers ?? [];
}

export async function fetchFlyerItems(flyerId: number): Promise<FlippItem[]> {
  const url = `${BASE}/flyers/${flyerId}/flyer_items?locale=en&sid=${sid()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Flipp items ${res.status}`);
  const data = (await res.json()) as FlippItem[] | { items?: FlippItem[] };
  return Array.isArray(data) ? data : (data.items ?? []);
}

export function formatItemPrice(item: FlippItem): string {
  if (item.price == null) return '';
  const n = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(item.price);
}
