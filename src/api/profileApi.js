import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

/**
 * Update the authenticated user's profile.
 *
 * @param {string} docId  - The user's server-side ID (_id / id from auth response).
 * @param {object} body   - Profile fields to update.
 */
export const updateProfileApi = async (docId, body) => {
  const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
    appName:    APP_NAME,
    moduleName: 'appuser',
    docId:      String(docId),
    body,
  });
  return data;
};
