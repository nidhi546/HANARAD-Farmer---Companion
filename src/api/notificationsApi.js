/**
 * notificationsApi.js — User notification CRUD.
 *
 * Module: 'notifications'
 *
 * Document shape:
 *   { notifId, userId, type, title, body, read, readAt, createdAt, updatedAt }
 *   type: 'weather' | 'market' | 'crop' | 'system'
 */
import api from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { APP_NAME } from './baseUrl';

const MODULE = 'notifications';

/**
 * Returns the count of unread notifications for a user.
 * Fetches up to 100 unread docs and uses list length as count.
 * Returns 0 on any error so the badge simply hides.
 */
export async function getUnreadCount(userId) {
  try {
    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      filter:     { userId, read: false },
      sort:       { createdAt: -1 },
      limit:      100,
    });
    return Array.isArray(data?.data) ? data.data.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch paginated notifications for a user, newest first.
 *
 * @param {string} userId
 * @param {object} [options]
 * @param {number} [options.limit]   default 30
 * @param {boolean} [options.unreadOnly]  filter to unread only
 */
export async function getNotifications(userId, { limit = 30, unreadOnly = false } = {}) {
  try {
    const filter = { userId };
    if (unreadOnly) filter.read = false;

    const { data } = await api.post(ENDPOINTS.GET_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      filter,
      sort:       { createdAt: -1 },
      limit,
    });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * Mark a single notification as read by its MongoDB _id.
 *
 * @param {string} docId   — MongoDB _id of the notification document
 */
export async function markNotificationRead(docId) {
  try {
    const { data } = await api.post(ENDPOINTS.SUBMIT_DATA, {
      appName:    APP_NAME,
      moduleName: MODULE,
      docId,
      body: {
        read:      true,
        readAt:    new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Mark all unread notifications as read for a user.
 * Fetches unread first, then patches each one in parallel.
 *
 * @param {string} userId
 */
export async function markAllRead(userId) {
  try {
    const unread = await getNotifications(userId, { unreadOnly: true, limit: 100 });
    await Promise.allSettled(
      unread.map((n) => markNotificationRead(n._id)),
    );
  } catch {}
}
