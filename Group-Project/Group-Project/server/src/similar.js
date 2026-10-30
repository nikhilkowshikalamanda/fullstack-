// "Is this probably a duplicate?" helper. Compares the category and the location.
import { OPEN_STATUSES } from './validate.js';

const STOP_WORDS = new Set(['the', 'near', 'opposite', 'behind', 'road', 'street', 'and', 'next', 'beside', 'front', 'side']);

const words = (text) =>
  new Set(
    String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

// Haversine formula: distance between two GPS points in metres.
function metres(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

// Returns up to 3 unresolved issues of the same category near the same place.
export function findSimilar(issues, { category, address, lat, lng }) {
  const mine = words(address);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  return issues
    .filter((i) => i.category === category && OPEN_STATUSES.includes(i.status))
    .filter((i) => {
      const near = hasCoords && i.location.lat !== null && metres(lat, lng, i.location.lat, i.location.lng) <= 150;
      return near || jaccard(mine, words(i.location.address)) >= 0.4;
    })
    .slice(0, 3);
}
