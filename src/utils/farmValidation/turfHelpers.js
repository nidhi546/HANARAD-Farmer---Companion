/**
 * Turf.js helpers for polygon validation.
 *
 * NOTE — @turf/turf v6 vs v7:
 *   v6: turf.intersect(poly1, poly2)
 *   v7: turf.intersect(turf.featureCollection([poly1, poly2]))
 * This file uses the v6 two-argument form, which is the most common in
 * React Native projects. If you upgrade to v7, change line ~54 accordingly.
 */
import * as turf from '@turf/turf';

// ── Convert react-native-maps coords to a turf Polygon Feature ───────────────
export function rnCoordsToTurf(coordinates) {
  if (!coordinates || coordinates.length < 3) return null;

  const ring = coordinates.map(({ latitude, longitude }) => [longitude, latitude]);
  // Close the ring
  const closed = [...ring, ring[0]];

  try {
    return turf.polygon([closed]);
  } catch {
    return null; // guard against self-intersecting polygons
  }
}

// ── Get [south, west, north, east] bounding box from rn-maps coords ──────────
export function getBbox(coordinates) {
  const poly = rnCoordsToTurf(coordinates);
  if (!poly) return null;
  const [west, south, east, north] = turf.bbox(poly);
  return [south, west, north, east];
}

// ── Calculate area in sq metres from rn-maps coords ──────────────────────────
export function calcAreaSqm(coordinates) {
  const poly = rnCoordsToTurf(coordinates);
  return poly ? turf.area(poly) : 0;
}

// ── Find all non-ag features that intersect the drawn polygon ─────────────────
/**
 * @param {turf.Feature<Polygon>}  drawnPoly
 * @param {turf.FeatureCollection} nonAgFC
 * @returns {Array<{ feature, intersection, overlapFraction, landuse }>}
 */
export function findOverlaps(drawnPoly, nonAgFC) {
  if (!nonAgFC?.features?.length) return [];

  const drawnArea = turf.area(drawnPoly);
  if (drawnArea === 0) return [];

  const overlaps = [];

  for (const feature of nonAgFC.features) {
    try {
      // turf v6 signature — two separate polygon arguments
      const intersection = turf.intersect(drawnPoly, feature);
      if (!intersection) continue;

      const overlapArea     = turf.area(intersection);
      const overlapFraction = overlapArea / drawnArea;

      if (overlapFraction > 0.005) { // ignore slivers < 0.5 %
        overlaps.push({
          feature,
          intersection,
          overlapFraction,
          landuse: feature.properties?.landuse ?? 'unknown',
        });
      }
    } catch {
      // Skip geometrically invalid features
    }
  }

  return overlaps;
}

// ── Sum all overlap fractions (capped at 1.0) ────────────────────────────────
export function totalOverlapFraction(overlaps) {
  return Math.min(
    overlaps.reduce((sum, o) => sum + o.overlapFraction, 0),
    1.0,
  );
}

// ── Convert a turf intersection geometry to react-native-maps coords ──────────
export function turfToRnCoords(feature) {
  if (!feature?.geometry) return [];

  const toRn = ring => ring.map(([longitude, latitude]) => ({ latitude, longitude }));

  if (feature.geometry.type === 'Polygon') {
    return [toRn(feature.geometry.coordinates[0])];
  }
  if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates.map(poly => toRn(poly[0]));
  }
  return [];
}
