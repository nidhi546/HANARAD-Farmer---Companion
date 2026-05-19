/**
 * osmApi.js — OpenStreetMap data helpers.
 *
 * reverseGeocode(lat, lon)
 *   → Nominatim: "what is at this GPS coordinate?" (land type, building, road …)
 *
 * fetchLandusePolygons(region)
 *   → Overpass: coloured landuse / natural / building polygons for the current viewport
 *
 * countUrbanFeatures(bbox)
 *   → Overpass count: how many buildings + residential zones in a bounding box?
 *     Used to warn the farmer when their drawn polygon covers urban land.
 *
 * All functions throw on network error; callers should try/catch.
 */
import { parseOverpassPolygons, parseLandTypeFromNominatim } from '../utils/osmLanduse';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS  = 'https://overpass-api.de/api/interpreter';
const UA        = 'HANARAD-Farmer-Companion/1.0 (farm-boundary-tool)';

// ── Fetch helper with manual AbortController timeout ─────────────────────────
function timedFetch(url, options, timeoutMs = 12000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
}

// ── Nominatim: reverse-geocode a single coordinate ───────────────────────────
/**
 * @param {number} lat
 * @param {number} lon
 * @returns {{ type: string, label: {en,hi,gu} }}
 */
export async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`;
  const res  = await timedFetch(
    url,
    { headers: { 'User-Agent': UA, Accept: 'application/json' } },
    8000,
  );
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  return parseLandTypeFromNominatim(data);
}

// ── Overpass: fetch landuse / natural / building polygons for a viewport ──────
/**
 * Returns an array of polygon objects ready for react-native-maps <Polygon>.
 * The query bbox is capped at 0.08° to keep response times fast on low-end phones.
 *
 * @param {{ latitude, longitude, latitudeDelta, longitudeDelta }} region
 * @returns {Array<{ id, coords, fill, stroke, warn, type }>}
 */
export async function fetchLandusePolygons(region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

  // Cap to 0.08° (~8 km) in each direction
  const halfLat = Math.min(latitudeDelta / 2, 0.04);
  const halfLon = Math.min(longitudeDelta / 2, 0.04);
  const s = (latitude  - halfLat).toFixed(6);
  const n = (latitude  + halfLat).toFixed(6);
  const w = (longitude - halfLon).toFixed(6);
  const e = (longitude + halfLon).toFixed(6);

  const query = `[out:json][timeout:15];
(
  way["landuse"](${s},${w},${n},${e});
  way["natural"]["natural"!="coastline"](${s},${w},${n},${e});
  way["building"](${s},${w},${n},${e});
);
out body;
>;
out skel qt;`;

  const res = await timedFetch(
    OVERPASS,
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':   UA,
      },
      body: `data=${encodeURIComponent(query)}`,
    },
    15000,
  );
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  return parseOverpassPolygons(data);
}

// ── Overpass count: buildings + residential zones inside a bounding box ───────
/**
 * Returns the count of OSM building + residential/commercial/industrial ways
 * inside the bbox.  Returns 0 on any error (building check is optional).
 *
 * @param {{ south, west, north, east }} bbox
 * @returns {number}
 */
export async function countUrbanFeatures({ south, west, north, east }) {
  const [s, w, n, e] = [south, west, north, east].map(v => v.toFixed(6));

  const query = `[out:json][timeout:8];
(
  way["building"](${s},${w},${n},${e});
  way["landuse"~"^(residential|commercial|industrial)$"](${s},${w},${n},${e});
  relation["landuse"~"^(residential|commercial|industrial)$"](${s},${w},${n},${e});
);
out count;`;

  try {
    const res = await timedFetch(
      OVERPASS,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':   UA,
        },
        body: `data=${encodeURIComponent(query)}`,
      },
      8000,
    );
    if (!res.ok) return 0;
    const data  = await res.json();
    const total = parseInt(data?.elements?.[0]?.tags?.total ?? '0', 10);
    return isNaN(total) ? 0 : total;
  } catch {
    return 0;  // silently fail — building check is advisory, not blocking
  }
}
