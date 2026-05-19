/**
 * useCrops — complete user-crop state management with optimistic updates.
 *
 * Strategy:
 *  1. Load immediately from AsyncStorage (instant UI, no spinner)
 *  2. Attempt background API fetch; replace local data if API returns more
 *  3. All writes update AsyncStorage first (optimistic), then call API
 *  4. API failures are silently tolerated — local data is source of truth
 *
 * The hook scopes crops to the currently logged-in user (by userId).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth }       from '../context/AuthContext';
import { Storage, KEYS } from '../utils/storage';
import {
  addUserCropApi,
  updateUserCropApi,
  deleteUserCropApi,
  getUserCropsApi,
} from '../api/cropApi';
import { CROP_STATUS } from '../constants/cropMaster';

// ── Internal helpers ────────────────────────────────────────────────────────

function makeDocId(userId) {
  return `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Merges this user's crops back into the shared storage array
async function persistCrops(userId, crops) {
  const all      = (await Storage.get(KEYS.USER_CROPS)) || [];
  const others   = all.filter(c => c.userId !== userId);
  await Storage.set(KEYS.USER_CROPS, [...others, ...crops]);
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCrops() {
  const { user }                   = useAuth();
  const [userCrops, setUserCrops]  = useState([]);
  const [loading,   setLoading]    = useState(false);
  const [syncing,   setSyncing]    = useState(false);  // background API sync
  const [error,     setError]      = useState(null);
  const hasFetched                 = useRef(false);

  // ── Load ────────────────────────────────────────────────────────────────
  const loadCrops = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Instant load from cache
      const all    = (await Storage.get(KEYS.USER_CROPS)) || [];
      const cached = all.filter(
        c => c.userId === user.id && c.cropStatus !== CROP_STATUS.DELETED,
      );
      setUserCrops(cached);

      // 2. Background API sync (once per session)
      if (!hasFetched.current) {
        hasFetched.current = true;
        setSyncing(true);
        const remote = await getUserCropsApi(user.id);
        if (remote.length > 0) {
          // Normalize: API records carry _id; local optimistic records carry docId.
          // Unify to docId so update/delete can always match by the same field.
          const normalized = remote.map(c => ({ ...c, docId: c.docId || c._id }));
          const active = normalized.filter(c => c.cropStatus !== CROP_STATUS.DELETED);
          setUserCrops(active);
          await persistCrops(user.id, normalized);
        }
        setSyncing(false);
      }
    } catch (e) {
      setError(e.message || 'Failed to load crops.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    hasFetched.current = false; // reset on user change
    loadCrops();
  }, [loadCrops]);

  // ── Add ─────────────────────────────────────────────────────────────────
  const addCrop = useCallback(async (formData) => {
    if (!user?.id) throw new Error('Not logged in.');

    const docId = makeDocId(user.id);
    const newCrop = {
      docId,
      userId:     user.id,
      cropStatus: CROP_STATUS.ACTIVE,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
      ...formData,
    };

    // Optimistic: update UI + storage immediately
    const updated = [newCrop, ...userCrops];
    setUserCrops(updated);
    await persistCrops(user.id, updated);

    // Background API write
    addUserCropApi(user.id, docId, formData).catch(() => {});

    return newCrop;
  }, [user?.id, userCrops]);

  // ── Update ───────────────────────────────────────────────────────────────
  const updateCrop = useCallback(async (docId, changes) => {
    // Match by docId (local) or _id (API-fetched, before normalization flushes)
    const updated = userCrops.map(c =>
      (c.docId === docId || c._id === docId)
        ? { ...c, ...changes, updatedAt: new Date().toISOString() }
        : c,
    );
    setUserCrops(updated);
    await persistCrops(user.id, updated);

    // docId here is always the real DB _id after normalization — API updates existing record
    updateUserCropApi(docId, changes).catch(() => {});
  }, [user?.id, userCrops]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteCrop = useCallback(async (docId) => {
    const updated = userCrops.filter(c => c.docId !== docId && c._id !== docId);
    setUserCrops(updated);
    await persistCrops(user.id, updated);

    deleteUserCropApi(docId).catch(() => {});
  }, [user?.id, userCrops]);

  // ── Derived counts ───────────────────────────────────────────────────────
  const activeCrops    = userCrops.filter(c => c.cropStatus === CROP_STATUS.ACTIVE);
  const harvestedCrops = userCrops.filter(c => c.cropStatus === CROP_STATUS.HARVESTED);

  return {
    userCrops,       // all non-deleted
    activeCrops,
    harvestedCrops,
    loading,
    syncing,
    error,
    addCrop,
    updateCrop,
    deleteCrop,
    refreshCrops: loadCrops,
  };
}
