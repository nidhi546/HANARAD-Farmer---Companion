/**
 * Overpass API query that returns non-agricultural landuse polygons
 * WITH their full geometry (using `out geom`) so @turf/turf can intersect them
 * against the user's drawn polygon.
 *
 * Uses `out geom qt` — nodes are embedded in each way, no separate `>` lookup needed.
 * Falls back to a mirror server if the primary endpoint fails.
 */
import { NON_AG_TAGS } from './landTypeConfig';

const PRIMARY  = 'https://overpass-api.de/api/interpreter';
const FALLBACK = 'https://overpass.kumi.systems/api/interpreter';
const UA       = 'HANARAD-Farmer-Companion/1.0 (farm-validation)';

// ── Build the Overpass QL query ───────────────────────────────────────────────
function buildQuery(south, west, north, east, tags) {
  const bbox      = `${south},${west},${north},${east}`;
  const tagFilter = tags.join('|');
  return `[out:json][timeout:20];
(
  way["landuse"~"^(${tagFilter})$"](${bbox});
  relation["landuse"~"^(${tagFilter})$"](${bbox});
);
out geom qt;`;
}

// ── Convert a way element (with embedded geometry) to a GeoJSON Feature ──────
function wayToFeature(way) {
  const geom = way.geometry;
  if (!Array.isArray(geom) || geom.length < 3) return null;

  const coords = geom.map(({ lat, lon }) => [lon, lat]);
  // Close the ring if not already closed
  const first = coords[0], last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);

  return {
    type: 'Feature',
    properties: {
      id:      way.id,
      landuse: way.tags?.landuse ?? 'unknown',
      name:    way.tags?.name    ?? null,
    },
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

// ── POST helper with timeout ──────────────────────────────────────────────────
async function postQuery(endpoint, query, signal) {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body:    `data=${encodeURIComponent(query)}`,
    signal,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  return res.json();
}

// ── Public: fetch non-agricultural polygons for a bounding box ───────────────
/**
 * @param {[number,number,number,number]} bbox  [south, west, north, east]
 * @param {string[]}                      tags  defaults to NON_AG_TAGS
 * @param {AbortSignal}                   signal
 * @returns {GeoJSON FeatureCollection}
 */
export async function fetchNonAgPolygons(bbox, tags = NON_AG_TAGS, signal) {
  const [south, west, north, east] = bbox.map(v => v.toFixed(6));
  const query = buildQuery(south, west, north, east, tags);

  let data;
  try {
    data = await postQuery(PRIMARY, query, signal);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // Retry on fallback mirror
    data = await postQuery(FALLBACK, query, signal);
  }

  const features = (data.elements ?? [])
    .filter(el => el.type === 'way' && el.geometry)
    .map(wayToFeature)
    .filter(Boolean);

  return { type: 'FeatureCollection', features };
}
