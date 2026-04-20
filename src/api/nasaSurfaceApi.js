const POWER_BASE = 'https://power.larc.nasa.gov/api';

// ── Farmer-key parameter IDs (highlighted in UI) ─────────────────────────────
export const FARMER_IDS = new Set([
  'T2M', 'T2M_MAX', 'T2M_MIN', 'T2MDEW',
  'PRECTOTCORR', 'PRECTOT',
  'RH2M',
  'ALLSKY_SFC_SW_DWN', 'CLRSKY_SFC_SW_DWN', 'ALLSKY_SFC_PAR_TOT',
  'WS10M', 'WD10M', 'WS50M',
  'GWETROOT', 'GWETPROF', 'GWETTOP',
  'PS',
]);

// Default set fetched for the live farm metrics dashboard
export const LIVE_FARM_PARAMS = [
  'T2M', 'T2M_MAX', 'T2M_MIN',
  'PRECTOTCORR',
  'RH2M',
  'WS10M',
  'ALLSKY_SFC_SW_DWN',
  'GWETROOT',
];

// ── Abort-safe fetch ──────────────────────────────────────────────────────────
function fetchTimeout(url, opts = {}, ms = 18000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ── Date helpers (NASA POWER has ~2-day data lag) ─────────────────────────────
function fmtNasaDate(d) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}

export function getNasaDateRange(daysBack = 7) {
  const end = new Date();
  end.setDate(end.getDate() - 2);          // 2-day lag buffer
  const start = new Date(end);
  start.setDate(start.getDate() - (daysBack - 1));
  return { start: fmtNasaDate(start), end: fmtNasaDate(end) };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch surface parameter catalog from the NASA POWER manager endpoint */
export const getSurfaceParameterCatalog = async () => {
  const res = await fetchTimeout(
    `${POWER_BASE}/system/manager/surface`,
    { headers: { accept: 'application/json' } },
    15000,
  );
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  return res.json();
};

/** Fetch daily surface data for a set of parameters at a location */
export const getSurfaceData = async (lat, lon, parameters, start, end) => {
  const params = Array.isArray(parameters) ? parameters.join(',') : parameters;
  const url =
    `${POWER_BASE}/temporal/daily/point` +
    `?parameters=${params}&community=AG` +
    `&longitude=${lon}&latitude=${lat}` +
    `&start=${start}&end=${end}&format=JSON`;
  const res = await fetchTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Data HTTP ${res.status}`);
  return res.json();
};

// ── Parsers ───────────────────────────────────────────────────────────────────

/** Classify a parameter ID into a category string */
export function classifyParam(id) {
  const u = id.toUpperCase();
  if (/^T2M|^TS$|TEMP|^T_|^TDEW/.test(u))                      return 'temperature';
  if (/^PREC|RAIN|SNOW|PRECIP/.test(u))                         return 'precipitation';
  if (/^RH|^QV|HUMID|MOIST/.test(u))                           return 'humidity';
  if (/ALLSKY|CLRSKY|_SW_|_LW_|_PAR_|UV_|INSOL|SOLAR/.test(u)) return 'solar';
  if (/^WS|^WD|WIND/.test(u))                                  return 'wind';
  if (/^PS$|^PBL|PRES/.test(u))                                return 'pressure';
  if (/^GWET|SOIL|^EVP|EVAP|EVPTR|LHLAND/.test(u))             return 'soil';
  if (/^VEGTYPE|SEAICE|OPENWATER|AIRPORT/.test(u))              return 'other';
  return 'other';
}

/** Parse the catalog JSON into a normalised array regardless of response shape */
export function parseCatalog(json) {
  let raw = {};

  if (json?.parameters && typeof json.parameters === 'object') {
    raw = json.parameters;
  } else if (json?.outputs && typeof json.outputs === 'object') {
    raw = json.outputs;
  } else if (json?.surface?.parameters && typeof json.surface.parameters === 'object') {
    raw = json.surface.parameters;
  } else if (json?.surface?.outputs && typeof json.surface.outputs === 'object') {
    raw = json.surface.outputs;
  } else if (json?.data && typeof json.data === 'object') {
    raw = json.data;
  } else if (typeof json === 'object' && json !== null) {
    // Last resort: pick any key whose value is a non-array object (covers vegtype_1, seaice, etc.)
    for (const [k, v] of Object.entries(json)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        raw[k] = v;
      }
    }
  }

  return Object.entries(raw)
    .map(([id, meta]) => ({
      id,
      label:    meta.description || meta.long_name || meta.Long_Name || meta.longname || meta.label || id,
      unit:     meta.unit || meta.units || (meta.Roughness ? 'roughness (m)' : ''),
      category: classifyParam(id),
      isFarmerKey: FARMER_IDS.has(id),
    }))
    .sort((a, b) => {
      // Farmer-key params first within each category
      if (a.isFarmerKey !== b.isFarmerKey) return a.isFarmerKey ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
}

/**
 * Extract the most recent non-fill value (-999) for each parameter.
 * Returns: { T2M: { value: '32.10', date: '20240415' }, ... }
 */
export function getLatestValues(apiResponse) {
  const params = apiResponse?.properties?.parameter || {};
  const result = {};
  for (const [id, dateMap] of Object.entries(params)) {
    const sorted = Object.keys(dateMap).sort().reverse();
    for (const date of sorted) {
      const raw = dateMap[date];
      if (raw !== -999 && raw !== null && raw !== undefined && !isNaN(raw)) {
        result[id] = { value: parseFloat(raw).toFixed(2), date };
        break;
      }
    }
  }
  return result;
}

/** Compute a simple period average for a parameter (skip fill values -999) */
export function computeAverage(apiResponse, paramId) {
  const dateMap = apiResponse?.properties?.parameter?.[paramId];
  if (!dateMap) return null;
  const vals = Object.values(dateMap).filter(v => v !== -999 && !isNaN(v));
  if (!vals.length) return null;
  return (vals.reduce((s, v) => s + parseFloat(v), 0) / vals.length).toFixed(2);
}

/** Compute period averages for all params in the live farm response */
export function computeAllAverages(apiResponse, paramIds) {
  const result = {};
  for (const id of paramIds) {
    const avg = computeAverage(apiResponse, id);
    if (avg !== null) result[id] = avg;
  }
  return result;
}
