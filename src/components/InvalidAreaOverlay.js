/**
 * InvalidAreaOverlay
 *
 * Renders the intersection zones between the drawn farm polygon and
 * non-agricultural OSM features as coloured <Polygon> overlays on the map.
 *
 * Each zone is the exact turf-computed intersection shape, so the highlight
 * follows the real geometry rather than just outlining the full OSM polygon.
 *
 * Props:
 *   overlaps  {Array}  — from useFarmValidation (overlaps state)
 */
import React from 'react';
import { Polygon } from 'react-native-maps';
import { turfToRnCoords }  from '../utils/farmValidation/turfHelpers';
import { NON_AG_STYLE }    from '../utils/farmValidation/landTypeConfig';

export default function InvalidAreaOverlay({ overlaps = [] }) {
  if (!overlaps.length) return null;

  return (
    <>
      {overlaps.flatMap((zone, zoneIdx) => {
        const style      = NON_AG_STYLE[zone.landuse] ?? NON_AG_STYLE._default;
        const ringArrays = turfToRnCoords(zone.intersection); // [[{lat,lon},...], ...]

        return ringArrays.map((coords, ringIdx) => {
          if (coords.length < 3) return null;
          return (
            <Polygon
              key={`invalid-${zoneIdx}-${ringIdx}`}
              coordinates={coords}
              fillColor={style.fill}
              strokeColor={style.stroke}
              strokeWidth={2.5}
            />
          );
        });
      })}
    </>
  );
}
