/**
 * FCM Service — Send push notifications via Firebase Admin SDK
 * Project: caryanams-ea9c1
 */

const { messaging } = require('../config/firebaseAdmin');

// ── Send to one device ────────────────────────────────────────────────────────
async function sendToDevice(token, { title, body, data = {}, channel = 'farmer-alerts' }) {
  const message = {
    token,
    notification: { title, body },
    data: { ...stringifyData(data), title, body },
    android: {
      notification: { channelId: channel, sound: 'default', priority: 'high' },
      priority: 'high',
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      return { success: false, invalid: true, error: err.message };
    }
    return { success: false, error: err.message };
  }
}

// ── Send to multiple devices (batched 500 max) ────────────────────────────────
async function sendToMultiple(tokens, { title, body, data = {}, channel = 'farmer-alerts' }) {
  if (!tokens?.length) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = [];

  for (const chunk of chunks) {
    const messages = chunk.map(token => ({
      token,
      notification: { title, body },
      data: { ...stringifyData(data), title, body },
      android: {
        notification: { channelId: channel, sound: 'default' },
        priority: 'high',
      },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    }));

    const res = await messaging.sendEach(messages);
    successCount += res.successCount;
    failureCount += res.failureCount;

    res.responses.forEach((r, i) => {
      if (!r.success &&
          r.error?.code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(chunk[i]);
      }
    });
  }

  return { successCount, failureCount, invalidTokens };
}

// ── Send to FCM topic ─────────────────────────────────────────────────────────
async function sendToTopic(topic, { title, body, data = {} }) {
  const message = {
    topic,
    notification: { title, body },
    data: { ...stringifyData(data), title, body },
    android: {
      notification: { channelId: 'farmer-alerts', sound: 'default', priority: 'high' },
      priority: 'high',
    },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  try {
    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// FCM data values must all be strings
function stringifyData(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = String(v);
  return out;
}

module.exports = { sendToDevice, sendToMultiple, sendToTopic };
