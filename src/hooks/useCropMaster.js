/**
 * useCropMaster — fetches the crop catalogue from the HANA Platform API.
 *
 * Load order:
 *  1. AsyncStorage cache (TTL 1 hour) → instant render, no spinner
 *  2. API: POST /mongo/getdata { moduleName: 'cropmaster' }
 *  3. Stale cache (expired) — if API fails, prefer old data over empty
 *
 * No static fallback — if no cache and API returns empty, crops = [].
 * Screens handle empty state themselves (show skeleton / "No crops" UI).
 */
import { useState, useEffect, useCallback } from 'react';
import { getCropMasterApi } from '../api/cropApi';
import { Storage, KEYS }    from '../utils/storage';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useCropMaster() {
  const [crops,   setCrops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [source,  setSource]  = useState(null); // 'cache' | 'api'

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // ── 1. Try fresh cache ─────────────────────────────────────────────
      if (!forceRefresh) {
        const cached = await Storage.get(KEYS.CROP_MASTER_CACHE);
        if (cached?.data?.length && Date.now() - cached.timestamp < CACHE_TTL) {
          setCrops(cached.data);
          setSource('cache');
          setLoading(false);
          refreshInBackground(); // update cache silently
          return;
        }
      }

      // ── 2. Fetch from API ──────────────────────────────────────────────
      const remote = await getCropMasterApi();
      if (remote.length > 0) {
        setCrops(remote);
        setSource('api');
        await Storage.set(KEYS.CROP_MASTER_CACHE, { data: remote, timestamp: Date.now() });
        return;
      }

      // ── 3. Expired cache is better than nothing ────────────────────────
      const stale = await Storage.get(KEYS.CROP_MASTER_CACHE);
      if (stale?.data?.length) {
        setCrops(stale.data);
        setSource('cache');
      } else {
        setCrops([]); // no data at all — screen shows empty state
      }
    } catch {
      // Keep whatever we already have on error
      const stale = await Storage.get(KEYS.CROP_MASTER_CACHE);
      if (stale?.data?.length) setCrops(stale.data);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshInBackground() {
    getCropMasterApi().then(async (remote) => {
      if (remote.length > 0) {
        setCrops(remote);
        setSource('api');
        await Storage.set(KEYS.CROP_MASTER_CACHE, { data: remote, timestamp: Date.now() });
      }
    }).catch(() => {});
  }

  useEffect(() => { load(); }, [load]);

  return {
    crops,
    loading,
    source,
    refreshCrops: () => load(true),
  };
}
