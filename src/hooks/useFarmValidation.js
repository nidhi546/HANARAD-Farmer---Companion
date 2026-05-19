/**
 * useFarmValidation
 *
 * Debounces validation as the user taps new polygon corners.
 * Flow:
 *   1. debouncedValidate(points) is called on every corner change (1 500 ms debounce)
 *   2. Fetches non-agricultural OSM polygons for the bounding box
 *   3. Uses @turf/turf to intersect them against the drawn polygon
 *   4. If total overlap ≥ OVERLAP_THRESHOLD → sets status=WARNING and shows modal
 *   5. Exposes overlapping zone list for the InvalidAreaOverlay map layer
 */
import { useState, useCallback, useRef } from 'react';
import { fetchNonAgPolygons }            from '../utils/farmValidation/overpassQuery';
import {
  rnCoordsToTurf,
  getBbox,
  findOverlaps,
  totalOverlapFraction,
} from '../utils/farmValidation/turfHelpers';
import { OVERLAP_THRESHOLD } from '../utils/farmValidation/landTypeConfig';

export const VS = {
  IDLE:    'idle',
  LOADING: 'loading',
  VALID:   'valid',
  WARNING: 'warning',
  ERROR:   'error',
};

const DEBOUNCE_MS = 1500;
const MIN_POINTS  = 3;

export default function useFarmValidation() {
  const [status,        setStatus]        = useState(VS.IDLE);
  const [overlaps,      setOverlaps]      = useState([]);   // [{feature,intersection,overlapFraction,landuse}]
  const [totalOverlap,  setTotalOverlap]  = useState(0);
  const [showModal,     setShowModal]     = useState(false);

  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  // ── Core validation (async, cancellable) ─────────────────────────────────
  const validate = useCallback(async (points) => {
    if (points.length < MIN_POINTS) {
      setStatus(VS.IDLE);
      setOverlaps([]);
      return;
    }

    setStatus(VS.LOADING);

    // Cancel in-flight request from the previous call
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const drawnPoly = rnCoordsToTurf(points);
      if (!drawnPoly) { setStatus(VS.IDLE); return; }

      const bbox    = getBbox(points);
      const nonAgFC = await fetchNonAgPolygons(bbox, undefined, abortRef.current.signal);

      const found   = findOverlaps(drawnPoly, nonAgFC);
      const overlap = totalOverlapFraction(found);

      setOverlaps(found);
      setTotalOverlap(overlap);

      if (overlap >= OVERLAP_THRESHOLD) {
        setStatus(VS.WARNING);
        setShowModal(true);
      } else {
        setStatus(VS.VALID);
        setShowModal(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[FarmValidation]', err.message);
      // Non-blocking: network failure → show error badge but don't block save
      setStatus(VS.ERROR);
    }
  }, []);

  // ── Debounced public entry point ──────────────────────────────────────────
  const debouncedValidate = useCallback((points) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validate(points), DEBOUNCE_MS);
  }, [validate]);

  // ── Run immediately (used when user taps "Complete Boundary") ─────────────
  const validateNow = useCallback((points) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    validate(points);
  }, [validate]);

  const dismissModal = useCallback(() => setShowModal(false), []);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setStatus(VS.IDLE);
    setOverlaps([]);
    setTotalOverlap(0);
    setShowModal(false);
  }, []);

  return {
    status,
    overlaps,
    totalOverlap,
    showModal,
    debouncedValidate,
    validateNow,
    dismissModal,
    reset,
  };
}
