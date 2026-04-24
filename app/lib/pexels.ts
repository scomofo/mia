// Pexels photo search — https://www.pexels.com/api/
// Free key at https://www.pexels.com/api/new/ (200 req/hour, 20k/month).

type PexelsSrc = {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};
type PexelsPhoto = {
  id: number;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: PexelsSrc;
};
type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
  total_results?: number;
};

export type PhotoResult = {
  url: string;
  thumbUrl: string;
  credit: string; // "Photo by <name> on Pexels"
  sourceUrl: string;
};

export async function searchMealPhoto(query: string): Promise<PhotoResult | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  if (!query) return null;

  // Pexels works better on simple nouns. Strip adjectives and keep the core.
  const q = query
    .replace(/[,·+&]/g, ' ')
    .replace(/\b(with|and|or|the|a|an|of|on|in)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q + ' food')}&per_page=5&orientation=landscape`;
  try {
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return null;
    const data = (await res.json()) as PexelsSearchResponse;
    const photo = data.photos?.[0];
    if (!photo) return null;
    return {
      url: photo.src.large,
      thumbUrl: photo.src.medium,
      credit: `Photo by ${photo.photographer} on Pexels`,
      sourceUrl: photo.photographer_url,
    };
  } catch (e) {
    console.warn('pexels search failed:', e);
    return null;
  }
}
