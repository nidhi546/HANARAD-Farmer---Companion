/**
 * farmApi.js — Farm boundary CRUD.
 *
 * Follows the exact same SUBMIT_DATA / GET_DATA pattern as cropApi.js.
 * Module name: 'farms'
 *
 * All writes  → SUBMIT_DATA endpoint
 * All reads   → GET_DATA endpoint with userId filter
 *
 * The frontend saves to AsyncStorage as a local cache on every write,
 * so the app works offline and falls back gracefully when the API is unreachable.
 */
import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

const MODULE = 'farms';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateFarmId() {
  return `farm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/** Compute polygon centroid from {latitude, longitude}[] */
function centroid(coords) {
  const n = coords.length;
  return {
    lat: coords.reduce((s, c) => s + c.latitude,  0) / n,
    lng: coords.reduce((s, c) => s + c.longitude, 0) / n,
  };
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Save a new farm to the database.
 *
 * @param {string} userId
 * @param {object} farmData
 *   farmName, village, primaryCrop,
 *   polygonCoordinates [{latitude, longitude}],
 *   areaSqm, areaAcres, areaBigha, areaHectares, areaVigha, areaSqFt,
 *   perimeterM, method,
 *   warningDetected {boolean}, warningTypes {string[]},
 *   mapSnapshot {string|null}
 * @returns {{ farmId: string, ...apiResponse }}
 */
export async function saveFarmApi(userId, farmData) {
  const farmId = generateFarmId();
  const center = centroid(farmData.polygonCoordinates);

  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE,
    body: {
      farmId,
      userId,
      farmName:           farmData.farmName,
      village:            farmData.village            ?? '',
      primaryCrop:        farmData.primaryCrop        ?? '',
      polygonCoordinates: farmData.polygonCoordinates,
      centerLat:          center.lat,
      centerLng:          center.lng,
      areaSqm:            farmData.areaSqm,
      areaAcres:          farmData.areaAcres,
      areaBigha:          farmData.areaBigha,
      areaHectares:       farmData.areaHectares,
      areaVigha:          farmData.areaVigha,
      areaSqFt:           farmData.areaSqFt,
      perimeterM:         farmData.perimeterM,
      method:             farmData.method             ?? 'manual',
      warningDetected:    farmData.warningDetected    ?? false,
      warningTypes:       farmData.warningTypes       ?? [],
      mapSnapshot:        farmData.mapSnapshot        ?? null,
      farmStatus:         'active',
      createdAt:          new Date().toISOString(),
      updatedAt:          new Date().toISOString(),
    },
  });

  return { ...data, farmId };
}

/**
 * Partial update — pass only the fields you want to change.
 * Always stamps updatedAt automatically.
 *
 * @param {string} docId    — MongoDB _id of the document
 * @param {object} updates  — fields to change, e.g. { farmStatus: 'deleted' }
 */
export async function updateFarmApi(docId, updates) {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE,
    docId,
    body: {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  });
  return data;
}

/**
 * Soft-delete — sets farmStatus = 'deleted' via updateFarmApi.
 * The document stays in the database; GET_DATA filters it out via
 * { farmStatus: { $ne: 'deleted' } }.
 *
 * @param {string} docId — MongoDB _id (NOT farmId)
 */
export async function deleteFarmApi(docId) {
  return updateFarmApi(docId, {
    farmStatus: 'deleted',
    deletedAt:  new Date().toISOString(),
  });
}

// ── Reads ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all active farms for a user, newest first.
 * Returns [] on error so callers can fall back to AsyncStorage cache.
 *
 * @param {string} userId
 * @returns {object[]}
 */
export async function getUserFarmsApi(userId) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      filter:     { userId, farmStatus: { $ne: 'deleted' } },
      sort:       { createdAt: -1 },
      limit:      200,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single farm by farmId.
 * Returns null on error.
 *
 * @param {string} farmId
 */
export async function getFarmByIdApi(farmId) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      filter:     { farmId },
      limit:      1,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

// ── Shape normaliser ──────────────────────────────────────────────────────────

/**
 * Convert an API farm document into the local shape used by SavedFarmsScreen
 * and FarmDetailScreen.  Keeps backward-compatibility with farms that were
 * saved to AsyncStorage before the API was introduced.
 *
 * @param {object} apiFarm — raw document from getUserFarmsApi
 * @returns {object}        — normalised local farm object
 */
export function normaliseApiFarm(apiFarm) {
  return {
    id:             apiFarm.farmId  ?? apiFarm._id,  // display / navigation key
    docId:          apiFarm._id,                     // MongoDB _id — required for SUBMIT_DATA updates
    name:           apiFarm.farmName,
    village:        apiFarm.village        ?? '',
    crop:           apiFarm.primaryCrop    ?? '',
    method:         apiFarm.method         ?? 'manual',
    savedAt:        apiFarm.createdAt,
    areaSqm:        apiFarm.areaSqm,
    perimeterM:     apiFarm.perimeterM,
    coords:         apiFarm.polygonCoordinates ?? [],
    warningDetected: apiFarm.warningDetected ?? false,
    warningTypes:   apiFarm.warningTypes    ?? [],
    area: {
      acres:      Number(apiFarm.areaAcres    ?? 0).toFixed(3),
      bigha:      Number(apiFarm.areaBigha    ?? 0).toFixed(2),
      vigha:      Number(apiFarm.areaVigha    ?? 0).toFixed(2),
      sqFt:       Number(apiFarm.areaSqFt     ?? 0).toFixed(0),
      hectares:   Number(apiFarm.areaHectares ?? 0).toFixed(4),
      sqm:        Number(apiFarm.areaSqm      ?? 0).toFixed(1),
      perimeterM: Number(apiFarm.perimeterM   ?? 0).toFixed(0),
    },
  };
}
