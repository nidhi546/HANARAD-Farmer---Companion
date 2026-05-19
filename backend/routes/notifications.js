const express    = require('express');
const router     = express.Router();
const DeviceToken  = require('../models/DeviceToken');
const Notification = require('../models/Notification');
const { sendToDevice, sendToMultiple } = require('../services/fcmService');

// ── Register / refresh device token ──────────────────────────────────────────
// POST /api/notifications/register-token
router.post('/register-token', async (req, res) => {
  const { userId, deviceToken, platform, language, region, cropTypes } = req.body;
  if (!userId || !deviceToken || !platform) {
    return res.status(400).json({ error: 'userId, deviceToken, platform required' });
  }
  try {
    await DeviceToken.findOneAndUpdate(
      { userId, deviceToken },
      { userId, deviceToken, platform, language, region, cropTypes },
      { upsert: true, new: true },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Remove token on logout ────────────────────────────────────────────────────
// POST /api/notifications/remove-token
router.post('/remove-token', async (req, res) => {
  const { userId, deviceToken } = req.body;
  try {
    await DeviceToken.deleteOne({ userId, deviceToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send to single user ───────────────────────────────────────────────────────
// POST /api/notifications/send-user
router.post('/send-user', async (req, res) => {
  const { userId, title, body, type = 'general', screen, data = {} } = req.body;
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'userId, title, body required' });
  }
  try {
    const tokens = await DeviceToken.find({ userId }).select('deviceToken language');
    if (!tokens.length) return res.status(404).json({ error: 'No devices for user' });

    const results = await Promise.all(
      tokens.map(t => sendToDevice(t.deviceToken, {
        title, body, data: { ...data, type, screen },
        channel: type === 'weather' ? 'weather-alerts' : 'farmer-alerts',
      })),
    );

    // Save notification record
    await Notification.create({ userId, title, message: body, type, screen, data });

    // Clean up invalid tokens
    const invalid = results
      .map((r, i) => r.invalid ? tokens[i].deviceToken : null)
      .filter(Boolean);
    if (invalid.length) await DeviceToken.deleteMany({ deviceToken: { $in: invalid } });

    res.json({ success: true, sent: results.filter(r => r.success).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send to ALL farmers ───────────────────────────────────────────────────────
// POST /api/notifications/send-all
router.post('/send-all', async (req, res) => {
  const { title, body, type = 'general', screen, data = {} } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title, body required' });

  try {
    const all    = await DeviceToken.find().select('deviceToken userId');
    const tokens = [...new Set(all.map(t => t.deviceToken))];

    const { successCount, failureCount, invalidTokens } =
      await sendToMultiple(tokens, { title, body, data: { ...data, type, screen } });

    if (invalidTokens.length) {
      await DeviceToken.deleteMany({ deviceToken: { $in: invalidTokens } });
    }

    res.json({ success: true, successCount, failureCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send by region ────────────────────────────────────────────────────────────
// POST /api/notifications/send-region
router.post('/send-region', async (req, res) => {
  const { region, title, body, type = 'weather', screen, data = {} } = req.body;
  if (!region || !title || !body) {
    return res.status(400).json({ error: 'region, title, body required' });
  }
  try {
    const records = await DeviceToken.find({ region }).select('deviceToken');
    const tokens  = records.map(r => r.deviceToken);
    const result  = await sendToMultiple(tokens, { title, body, data: { ...data, type, screen } });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send by crop type ─────────────────────────────────────────────────────────
// POST /api/notifications/send-crop
router.post('/send-crop', async (req, res) => {
  const { cropType, title, body, type = 'crop', screen, data = {} } = req.body;
  if (!cropType || !title || !body) {
    return res.status(400).json({ error: 'cropType, title, body required' });
  }
  try {
    const records = await DeviceToken.find({ cropTypes: cropType }).select('deviceToken');
    const tokens  = records.map(r => r.deviceToken);
    const result  = await sendToMultiple(tokens, { title, body, data: { ...data, type, screen } });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get notification history for a user ───────────────────────────────────────
// GET /api/notifications/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const history = await Notification
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
