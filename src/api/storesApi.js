/**
 * NEARBY AGRICULTURAL STORES
 * ─────────────────────────────────────────────────────────────────
 * Source : Overpass API  →  OpenStreetMap data
 * Cost   : 100% FREE, no API key, no registration
 * Docs   : https://overpass-api.de
 * ─────────────────────────────────────────────────────────────────
 */

const OVERPASS = 'https://overpass-api.de/api/interpreter';

/**
 * Find agricultural shops / markets near a GPS coordinate.
 * Returns an array of store objects sorted by distance.
 */
export async function getNearbyStores(lat, lon, radiusMeters = 15000) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="agrarian"](around:${radiusMeters},${lat},${lon});
      node["shop"="farm"](around:${radiusMeters},${lat},${lon});
      node["shop"="garden_centre"](around:${radiusMeters},${lat},${lon});
      node["amenity"="marketplace"](around:${radiusMeters},${lat},${lon});
      node["landuse"="farmyard"]["name"](around:${radiusMeters},${lat},${lon});
    );
    out body;
  `;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const res  = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
    signal:  controller.signal,
  }).finally(() => clearTimeout(timer));

  const json = await res.json();

  return (json.elements || [])
    .map(el => ({
      id:       el.id,
      name:     el.tags?.name || inferName(el.tags),
      type:     inferType(el.tags),
      icon:     inferIcon(el.tags),
      phone:    el.tags?.phone || el.tags?.['contact:phone'] || null,
      address:  buildAddress(el.tags),
      lat:      el.lat,
      lon:      el.lon,
      distance: haversine(lat, lon, el.lat, el.lon),
    }))
    .sort((a, b) => a.distance - b.distance);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inferName(tags = {}) {
  if (tags.shop === 'agrarian')    return 'Agricultural Shop';
  if (tags.shop === 'farm')        return 'Farm Store';
  if (tags.amenity === 'marketplace') return 'Market';
  return 'Agricultural Store';
}

function inferType(tags = {}) {
  if (tags.amenity === 'marketplace') return 'Mandi / Market';
  if (tags.shop === 'farm')           return 'Farm Store';
  if (tags.shop === 'garden_centre')  return 'Garden Centre';
  return 'Agri Store';
}

function inferIcon(tags = {}) {
  if (tags.amenity === 'marketplace') return '🏪';
  if (tags.shop === 'farm')           return '🚜';
  if (tags.shop === 'garden_centre')  return '🌱';
  return '🌾';
}

function buildAddress(tags = {}) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:village'] || tags['addr:city'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Haversine great-circle distance in km */
function haversine(lat1, lon1, lat2, lon2) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dN = ((lon2 - lon1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
