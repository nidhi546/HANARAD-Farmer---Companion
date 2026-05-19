/**
 * useAuthFlow — decides where to navigate after a successful OTP login.
 *
 * Priority:
 *  1. Local PROFILE_SETUP_DONE flag (fastest; covers every app-reopen)
 *  2. User object fields check (covers cross-device if API returns full profile)
 *  3. Default → ProfileSetup
 *
 * Returns 'Main' or 'ProfileSetup'.
 */
import { useCallback } from 'react';
import { useAuth }     from '../context/AuthContext';
import { Storage, KEYS } from '../utils/storage';

export function useAuthFlow() {
  const { isProfileComplete } = useAuth();

  const resolvePostLoginRoute = useCallback(async (user) => {
    const flagDone = await Storage.get(KEYS.PROFILE_SETUP_DONE);
    if (flagDone) return 'Main';

    if (isProfileComplete(user)) {
      await Storage.set(KEYS.PROFILE_SETUP_DONE, true);
      return 'Main';
    }

    return 'ProfileSetup';
  }, [isProfileComplete]);

  return { resolvePostLoginRoute };
}
