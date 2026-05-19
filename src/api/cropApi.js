/**
 * cropApi.js — Full CRUD for crop master catalogue + user crops.
 *
 * Modules:
 *   'cropmaster'  — shared crop catalogue (admin-approved + user-submitted)
 *   'usercrops'   — per-user crop records (active / harvested / deleted)
 *
 * All writes  → SUBMIT_DATA endpoint
 * All reads   → GET_DATA endpoint with structured filter + sort + pagination
 *
 * Pagination: page is 1-based; we pass skip = (page-1) * limit to the API.
 * The caller detects hasMore by checking items.length === limit.
 */
import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

const MODULE        = 'usercrops';
const MODULE_MASTER = 'cropmaster';
const DEFAULT_LIMIT = 20;

// ─────────────────────────────────────────────────────────────────────────────
// CROP MASTER — READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated + searchable crop master query.
 *
 * Returns approved system crops. Empty query = all crops (browse mode).
 * Non-empty query = real-time search via case-insensitive regex on cropName.
 *
 * @param {object}  opts
 * @param {string}  [opts.query='']   - search string
 * @param {number}  [opts.page=1]     - 1-based page
 * @param {number}  [opts.limit=20]   - items per page
 * @returns {{ items: object[], hasMore: boolean, page: number }}
 */
export async function searchCropMasterApi({ query = '', page = 1, limit = DEFAULT_LIMIT } = {}) {
  try {
    const filter = { isActive: true, approved: true };
    if (query.trim()) {
      filter.cropName = { $regex: query.trim(), $options: 'i' };
    }
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_MASTER,
      filter,
      sort:       { sortOrder: 1, cropName: 1 },
      limit,
      skip:       (page - 1) * limit,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    return { items, hasMore: items.length === limit, page };
  } catch {
    return { items: [], hasMore: false, page };
  }
}

/**
 * Fetch the full crop master list in one call (for browse/grid screens).
 * Uses a high limit; callers are responsible for caching the result.
 */
export async function getCropMasterApi() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_MASTER,
      filter:     { isActive: true, approved: true },
      sort:       { sortOrder: 1 },
      limit:      500,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch crops submitted by a specific user (approved + pending).
 * Used to show user's own pending submissions alongside system crops.
 *
 * @param {string} userId
 */
export async function getUserAddedCropsApi(userId) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_MASTER,
      filter:     { createdBy: userId, createdType: 'user' },
      sort:       { createdAt: -1 },
      limit:      50,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Duplicate-name guard: returns true if an approved or pending crop with
 * exactly this name already exists (case-insensitive).
 *
 * @param {string} cropName - already normalized (Title Case)
 */
export async function checkCropNameExistsApi(cropName) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE_MASTER,
      filter:     {
        cropName: { $regex: `^${cropName.trim()}$`, $options: 'i' },
        isActive: true,
      },
      limit: 1,
    });
    return Array.isArray(data?.data) && data.data.length > 0;
  } catch {
    return false; // on error, allow submission (server validates too)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP MASTER — WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a new crop to the master catalogue.
 *
 * User-submitted crops start as:
 *   approved: false  — not shown to other users until admin approves
 *   createdType: 'user'
 *
 * The submitter can use their own crop immediately (useCropSearch
 * includes user's own pending crops alongside approved system crops).
 *
 * @param {string} userId
 * @param {string} docId  - pre-generated; becomes the cropId too
 * @param {object} body   - crop fields (cropName required)
 */
export async function addCropMasterApi(userId, docId, body) {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE_MASTER,
    // docId,
    body: {
      ...body,
      cropId:      docId,
      createdBy:   userId,
      createdType: 'user',
      approved:    false,
      isActive:    true,
      sortOrder:   9999,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER CROPS — WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new crop record for a user.
 * docId is generated by useCrops hook so the caller has it for optimistic UI.
 *
 * @param {string} userId
 * @param {string} docId
 * @param {object} body
 */
export async function addUserCropApi(userId, docId, body) {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE,
    // docId,
    body: {
      userId,
      ...body,
      cropStatus: 'active',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    },
  });
  return data;
}

/**
 * Partial update for a user crop (pass only changed fields).
 *
 * @param {string} docId
 * @param {object} body
 */
export async function updateUserCropApi(docId, body) {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE,
    docId,
    body: {
      ...body,
      updatedAt: new Date().toISOString(),
    },
  });
  return data;
}

/**
 * Soft-delete: sets cropStatus = 'deleted'. Record stays in DB for audit.
 *
 * @param {string} docId
 */
export async function deleteUserCropApi(docId) {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: MODULE,
    docId,
    body: {
      cropStatus: 'deleted',
      deletedAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY / SUBCATEGORY / CROP MASTER — DEPENDENT DROPDOWNS
// These three APIs supply the Category → SubCategory → Crop picker hierarchy.
// All data is fetched once and filtered client-side.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all crop categories.
 * Response shape: [{ _id, category, localCategoryName }]
 */
export async function getCropCategoriesApi() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'cropcategory',
      query:      {},
      limit:      0,
      skip:       0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all crop subcategories (unfiltered).
 * Caller filters by subcategory.category === selectedCategory._id.
 * Response shape: [{ _id, category, subcategory, localSubCategoryName }]
 */
export async function getCropSubCategoriesApi() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'cropSubCategory',
      query:      {},
      limit:      0,
      skip:       0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all crops from the cropMaster module (unfiltered).
 * Caller filters by crop.subcategory === selectedSubCategory._id.
 * Response shape: [{ _id, subcategory, cropName, localCropName }]
 */
export async function getCropsByMasterApi() {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: 'cropMaster',
      query:      {},
      limit:      0,
      skip:       0,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER CROPS — READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all non-deleted crops for a user.
 * Returns [] on error — caller falls back to AsyncStorage cache.
 *
 * @param {string} userId
 */
export async function getUserCropsApi(userId) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      filter:     { userId, cropStatus: { $ne: 'deleted' } },
      sort:       { createdAt: -1 },
      limit:      200,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}
