/**
 * useProfile — submits profile data to the API and syncs local auth state.
 *
 * Handles:
 *  - Resolving docId from the current auth user
 *  - Mapping form fields to the API body shape
 *  - Calling updateProfileApi
 *  - Calling updateUser (local state + AsyncStorage)
 *  - Setting PROFILE_SETUP_DONE flag
 *  - loading / error state
 */
import { useState, useCallback } from 'react';
import { useAuth }               from '../context/AuthContext';
import { updateProfileApi }      from '../api/profileApi';
import { Storage, KEYS }         from '../utils/storage';

export function useProfile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving]  = useState(false);
  const [error,  setError]   = useState(null);

  /**
   * @param {object} fields - Form values: name, mobile, dob, address, city,
   *                          state, language, village, crops, avatar, photo
   */
  const saveProfile = useCallback(async (fields) => {
    const docId = user?._id ?? user?.id;
    if (!docId) throw new Error('User session not found. Please log in again.');

    setSaving(true);
    setError(null);
    try {
      // Shape expected by the HANA Platform submitdata endpoint
      await updateProfileApi(docId, {
        username: (fields.name || '').toLowerCase().replace(/\s+/g, '_'),
        mobile:   fields.mobile   || fields.phone || '',
        dob:      fields.dob      || '',
        address:  fields.address  || '',
        city:     fields.city     || '',
        state:    fields.state    || '',
        language: fields.language || 'en',
        village:  fields.village  || '',
        crops:    fields.crops    || [],
        avatar:   fields.avatar   || '',
      });

      const merged = await updateUser({
        name:     fields.name,
        phone:    fields.mobile || fields.phone || '',
        dob:      fields.dob      || '',
        address:  fields.address  || '',
        city:     fields.city     || '',
        state:    fields.state    || '',
        language: fields.language || 'en',
        village:  fields.village  || '',
        crops:    fields.crops    || [],
        avatar:   fields.avatar   || '',
        photo:    fields.photo    || null,
      });

      await Storage.set(KEYS.PROFILE_SETUP_DONE, true);
      return merged;
    } catch (e) {
      const msg = e.message || 'Failed to save profile.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [user, updateUser]);

  return { saveProfile, saving, error };
}
