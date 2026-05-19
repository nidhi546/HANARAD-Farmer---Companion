/**
 * useNasaConfig
 *
 * Hook that loads the NASA POWER system configuration endpoint.
 *
 * HONEST NOTE: This endpoint returns version metadata ONLY (v2.8.0 etc.).
 * It has no farming value. Use it for:
 *   - Admin / debug screens ("Connected to NASA POWER v2.8.0")
 *   - Version compatibility checks before making data requests
 *   - Displaying an "About" section in Settings
 *
 * Cached for 30 days. Will not re-fetch until cache expires.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchNasaConfiguration,
  getApiVersionLabel,
  clearNasaSystemCache,
} from '../services/nasaSystemApi';

export default function useNasaConfig() {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [source,       setSource]       = useState(null);
  const [versionLabel, setVersionLabel] = useState('NASA POWER API');
  const [rawConfig,    setRawConfig]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, source: src } = await fetchNasaConfiguration();
      setRawConfig(data);
      setVersionLabel(getApiVersionLabel(data));
      setSource(src);
    } catch (err) {
      setError(err.message || 'Failed to load NASA configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearCache = useCallback(async () => {
    await clearNasaSystemCache();
    load();
  }, [load]);

  return {
    loading,
    error,
    source,
    versionLabel,    // e.g. "POWER Manager API v2.8.0"
    rawConfig,       // full raw JSON for debug display
    reload: load,
    clearCache,
  };
}
