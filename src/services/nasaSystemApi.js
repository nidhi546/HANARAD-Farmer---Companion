/**
 * NASA POWER System Metadata Service
 *
 * Wraps two system-manager endpoints:
 *   1. /api/system/manager/system/groupings  — parameter catalog by community + temporal
 *   2. /api/system/manager/configuration     — API version metadata (debug only)
 *
 * Both are pure metadata. Cache aggressively; refresh weekly at most.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const POWER_BASE = 'https://power.larc.nasa.gov/api';

const CACHE_KEY_GROUPINGS  = 'nasa_system_groupings_v1';
const CACHE_KEY_CONFIG     = 'nasa_system_config_v1';
const CACHE_TTL_GROUPINGS  = 7  * 24 * 60 * 60 * 1000; // 7 days
const CACHE_TTL_CONFIG     = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Internal helpers ──────────────────────────────────────────────────────────

function fetchWithTimeout(url, ms = 15000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    headers: { accept: 'application/json' },
    signal: ctrl.signal,
  }).finally(() => clearTimeout(timer));
}

async function fetchWithRetry(url, retries = 2, ms = 15000) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetchWithTimeout(url, ms);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeCache(key, data, ttl) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now(), ttl }));
  } catch { /* storage full — proceed without caching */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch the NASA POWER parameter groupings.
 *
 * Returns the raw JSON grouped by community (AG/SB/RE) → temporal resolution
 * (Hourly/Daily/Monthly/Climatology) → category group → array of { name, abbreviation }.
 *
 * Cached for 7 days. Falls back to stale cache if network fails.
 */
export async function fetchNasaGroupings() {
  const cached = await readCache(CACHE_KEY_GROUPINGS);
  if (cached) return { data: cached, source: 'cache' };

  try {
    const data = await fetchWithRetry(
      `${POWER_BASE}/system/manager/system/groupings`,
    );
    await writeCache(CACHE_KEY_GROUPINGS, data, CACHE_TTL_GROUPINGS);
    return { data, source: 'network' };
  } catch (err) {
    // Offline fallback: return stale cache even if expired
    const stale = await AsyncStorage.getItem(CACHE_KEY_GROUPINGS);
    if (stale) {
      return { data: JSON.parse(stale).data, source: 'stale-cache' };
    }
    throw err;
  }
}

/**
 * Fetch the NASA POWER system configuration.
 *
 * Returns version metadata only (v2.8.0 etc.). Useful for a debug/admin screen.
 * Cached for 30 days.
 */
export async function fetchNasaConfiguration() {
  const cached = await readCache(CACHE_KEY_CONFIG);
  if (cached) return { data: cached, source: 'cache' };

  try {
    const data = await fetchWithRetry(
      `${POWER_BASE}/system/manager/configuration`,
    );
    await writeCache(CACHE_KEY_CONFIG, data, CACHE_TTL_CONFIG);
    return { data, source: 'network' };
  } catch (err) {
    const stale = await AsyncStorage.getItem(CACHE_KEY_CONFIG);
    if (stale) {
      return { data: JSON.parse(stale).data, source: 'stale-cache' };
    }
    throw err;
  }
}

/**
 * Force-clear both caches (useful from an admin settings panel).
 */
export async function clearNasaSystemCache() {
  await AsyncStorage.multiRemove([CACHE_KEY_GROUPINGS, CACHE_KEY_CONFIG]);
}

// ── Groupings parser ──────────────────────────────────────────────────────────

/**
 * Parse raw groupings JSON for a specific community and temporal resolution.
 *
 * @param {object} groupingsJson  - raw response from fetchNasaGroupings()
 * @param {'AG'|'SB'|'RE'} community  - use 'AG' for agriculture
 * @param {'Daily'|'Monthly'|'Climatology'|'Hourly'} temporal
 * @returns {Array<{ categoryGroup: string, name: string, abbreviation: string }>}
 *
 * Example returned item:
 *   { categoryGroup: 'Temperatures', name: '2m Air Temperature', abbreviation: 'T2M' }
 */
export function parseGroupings(groupingsJson, community = 'AG', temporal = 'Daily') {
  const groups = groupingsJson?.groups;
  if (!groups) return [];

  const communityData = groups[community];
  if (!communityData) return [];

  const temporalData = communityData[temporal];
  if (!temporalData) return [];

  const result = [];
  for (const [categoryGroup, params] of Object.entries(temporalData)) {
    if (!Array.isArray(params)) continue;
    for (const param of params) {
      if (param.abbreviation) {
        result.push({
          categoryGroup,
          name:         param.name || param.abbreviation,
          abbreviation: param.abbreviation,
        });
      }
    }
  }
  return result;
}

/**
 * Extract unique category group names for a community + temporal combo.
 * Useful for building a dynamic filter pill bar.
 */
export function getGroupCategories(groupingsJson, community = 'AG', temporal = 'Daily') {
  const params = parseGroupings(groupingsJson, community, temporal);
  return [...new Set(params.map(p => p.categoryGroup))];
}

/**
 * Build a Set of all parameter abbreviations available for a community.
 * Replaces the hardcoded FARMER_IDS set when you want a dynamic solution.
 */
export function buildParamSet(groupingsJson, community = 'AG') {
  const temporals = ['Daily', 'Monthly', 'Climatology', 'Hourly'];
  const ids = new Set();
  for (const t of temporals) {
    parseGroupings(groupingsJson, community, t).forEach(p => ids.add(p.abbreviation));
  }
  return ids;
}

/**
 * Get version string from configuration response.
 * e.g. "POWER Manager API v2.8.0"
 */
export function getApiVersionLabel(configJson) {
  const doc = configJson?.documentation;
  if (!doc) return 'NASA POWER API';
  return `${doc.title || 'NASA POWER'} ${doc.version || ''}`.trim();
}
