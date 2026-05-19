/**
 * useNasaGroupings
 *
 * Hook that loads the NASA POWER parameter groupings for the AG community.
 * Returns parameters organized by category group — ready for dynamic filter
 * pills, parameter dropdowns, and the weather card grid.
 *
 * Data is cached for 7 days in AsyncStorage; subsequent mounts are instant.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchNasaGroupings,
  parseGroupings,
  getGroupCategories,
} from '../services/nasaSystemApi';

const DEFAULT_STATE = {
  loading:     true,
  error:       null,
  source:      null,        // 'cache' | 'network' | 'stale-cache'
  rawJson:     null,
  // AG Daily params — the most useful for farmers
  dailyParams: [],          // [{ categoryGroup, name, abbreviation }]
  categories:  [],          // ['Temperatures', 'Humidity/Precipitation', ...]
  // Lookup map: abbreviation → full param object (fast O(1) access)
  paramMap:    {},
};

export default function useNasaGroupings() {
  const [state, setState] = useState(DEFAULT_STATE);

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, source } = await fetchNasaGroupings();

      const dailyParams = parseGroupings(data, 'AG', 'Daily');
      const categories  = getGroupCategories(data, 'AG', 'Daily');

      const paramMap = {};
      dailyParams.forEach(p => { paramMap[p.abbreviation] = p; });

      setState({
        loading:     false,
        error:       null,
        source,
        rawJson:     data,
        dailyParams,
        categories,
        paramMap,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:   err.message || 'Failed to load NASA parameter groupings',
      }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Filter daily parameters by category group name.
   * Pass null or 'All' to get the full list.
   *
   * @param {string|null} categoryGroup
   * @returns {Array<{ categoryGroup, name, abbreviation }>}
   */
  const getParamsForCategory = useCallback(
    (categoryGroup) => {
      if (!categoryGroup || categoryGroup === 'All') return state.dailyParams;
      return state.dailyParams.filter(p => p.categoryGroup === categoryGroup);
    },
    [state.dailyParams],
  );

  /**
   * Check if a parameter abbreviation belongs to the AG Daily group.
   * Replaces the hardcoded FARMER_IDS.has() check.
   */
  const isAgParam = useCallback(
    (abbreviation) => Boolean(state.paramMap[abbreviation]),
    [state.paramMap],
  );

  /**
   * Get the full name for an abbreviation — useful for tooltips and labels.
   * Falls back to the abbreviation itself if not found.
   */
  const getParamName = useCallback(
    (abbreviation) => state.paramMap[abbreviation]?.name ?? abbreviation,
    [state.paramMap],
  );

  return {
    ...state,
    reload:              load,
    getParamsForCategory,
    isAgParam,
    getParamName,
  };
}
