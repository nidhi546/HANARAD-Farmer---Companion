/**
 * diseaseApi.js — Disease Scanner module API calls.
 *
 * moduleName: 'diseases'      — admin-managed disease catalogue
 * moduleName: 'diseasescans'  — per-user AI scan history
 *
 * All reads  → POST /mongo/getdata   { appName, moduleName, filter, sort, limit, skip }
 * All writes → POST /mongo/submitdata { appName, moduleName, docId, body }
 *
 * MongoDB document shape (diseases):
 *   slug, cropKey, severity, isActive, sortOrder, aiLabels,
 *   name{en,hi,gu,tl}, symptoms{en,hi,gu,tl},
 *   treatments{en,hi,gu,tl}[], medicines[], prevention{en,hi,gu,tl},
 *   imageUrl, createdAt, updatedAt
 *
 * MongoDB document shape (diseasescans):
 *   scanId, userId, imageUrl, cropKey, farmId,
 *   detectedDisease{ diseaseId, slug, name, confidence, severity },
 *   status, isDeleted, createdAt, updatedAt
 */
import api        from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME }  from './baseUrl';

const MODULE_DISEASES = 'diseases';
const MODULE_SCANS    = 'diseasescans';

// ─────────────────────────────────────────────────────────────────────────────
// DISEASES — READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all active diseases. Optionally filter by cropKey.
 * Returns [] on error so screen falls back to offline bundle.
 *
 * @param {string} [cropKey]  — 'cotton' | 'groundnut' | etc. Omit for all crops.
 */
export async function getDiseasesApi(cropKey) {
  try {
    const filter = { isActive: true };
    if (cropKey && cropKey !== 'all') filter.cropKey = cropKey;

    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_DISEASES,
      filter,
      sort:  { sortOrder: 1, severity: 1 },
      limit: 500,
      skip:  0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single disease by its slug.
 *
 * @param {string} slug  — e.g. 'cotton-leaf-curl-virus'
 */
export async function getDiseaseBySlugApi(slug) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_DISEASES,
      filter:     { slug, isActive: true },
      limit:      1,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return items[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the full offline bundle — all active diseases, compact payload.
 * Call once on app launch and cache the result in AsyncStorage (TTL 7 days).
 */
export async function getDiseasesBundleApi() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_DISEASES,
      filter:     { isActive: true },
      sort:       { cropKey: 1, sortOrder: 1 },
      limit:      1000,
      skip:       0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE SCANS — READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch scan history for a user (newest first).
 *
 * @param {string} userId
 * @param {number} [limit=20]
 */
export async function getUserScansApi(userId, limit = 20) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_SCANS,
      filter:     { userId, isDeleted: false },
      sort:       { createdAt: -1 },
      limit,
      skip:       0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE SCANS — WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save a completed scan result to the user's history.
 *
 * @param {string} userId
 * @param {object} scanData
 * @param {string} scanData.imageUrl         — hosted image URL (or local URI for now)
 * @param {string} scanData.cropKey          — selected crop e.g. 'cotton'
 * @param {string} [scanData.farmId]         — optional linked farm
 * @param {object} scanData.detectedDisease  — { diseaseId, slug, name, confidence, severity }
 */
export async function saveScanApi(userId, scanData) {
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_SCANS,
      body: {
        scanId,
        userId,
        imageUrl:        scanData.imageUrl ?? null,
        cropKey:         scanData.cropKey  ?? 'unknown',
        farmId:          scanData.farmId   ?? null,
        detectedDisease: scanData.detectedDisease ?? null,
        status:          'completed',
        isDeleted:       false,
        createdAt:       new Date().toISOString(),
        updatedAt:       new Date().toISOString(),
      },
    });
    return { success: true, scanId, data };
  } catch {
    return { success: false, scanId };
  }
}

/**
 * Soft-delete a scan from user history.
 *
 * @param {string} docId  — MongoDB _id of the scan document
 */
export async function deleteScanApi(docId) {
  try {
    await api.post(ENDPOINTS.SUBMIT_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_SCANS,
      docId,
      body: {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return true;
  } catch {
    return false;
  }
}
