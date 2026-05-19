/**
 * farms.js — REST routes for farm boundary management.
 *
 * Mounted at: /api/farms
 *
 * POST   /api/farms                    — Save a new farm
 * GET    /api/farms/user/:userId       — All active farms for a user
 * GET    /api/farms/:farmId            — Single farm detail
 * PATCH  /api/farms/:farmId            — Update farm fields
 * DELETE /api/farms/:farmId            — Soft delete
 *
 * API response envelope: { status: 'success'|'error', data, message?, count? }
 */
const express = require('express');
const router  = express.Router();
const Farm    = require('../models/Farm');

function generateFarmId() {
  return `farm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ── POST /api/farms — Save new farm ──────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      userId, farmName, village, primaryCrop,
      polygonCoordinates,
      centerLat, centerLng,
      areaSqm, areaAcres, areaBigha, areaHectares, areaVigha, areaSqFt,
      perimeterM, method,
      warningDetected, warningTypes,
      mapSnapshot,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!userId)             return res.status(400).json({ status: 'error', message: 'userId is required.' });
    if (!farmName?.trim())   return res.status(400).json({ status: 'error', message: 'farmName is required.' });
    if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length < 3) {
      return res.status(400).json({ status: 'error', message: 'polygonCoordinates must have at least 3 points.' });
    }

    const farm = await Farm.create({
      farmId:             generateFarmId(),
      userId,
      farmName:           farmName.trim(),
      village:            village?.trim()     ?? '',
      primaryCrop:        primaryCrop?.trim() ?? '',
      polygonCoordinates,
      centerLat,
      centerLng,
      areaSqm,
      areaAcres,
      areaBigha,
      areaHectares,
      areaVigha,
      areaSqFt,
      perimeterM,
      method:          method          ?? 'manual',
      warningDetected: warningDetected ?? false,
      warningTypes:    warningTypes    ?? [],
      mapSnapshot:     mapSnapshot     ?? null,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });

    return res.status(201).json({ status: 'success', data: farm.toObject() });
  } catch (err) {
    console.error('[POST /api/farms]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Duplicate farm ID. Please retry.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to save farm.' });
  }
});

// ── GET /api/farms/user/:userId — All active farms for a user ─────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const farms = await Farm
      .find({ userId: req.params.userId, farmStatus: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return res.json({ status: 'success', data: farms, count: farms.length });
  } catch (err) {
    console.error('[GET /api/farms/user/:userId]', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch farms.' });
  }
});

// ── GET /api/farms/:farmId — Single farm detail ───────────────────────────────
router.get('/:farmId', async (req, res) => {
  try {
    const farm = await Farm
      .findOne({ farmId: req.params.farmId })
      .select('-__v')
      .lean();

    if (!farm) return res.status(404).json({ status: 'error', message: 'Farm not found.' });
    return res.json({ status: 'success', data: farm });
  } catch (err) {
    console.error('[GET /api/farms/:farmId]', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch farm.' });
  }
});

// ── PATCH /api/farms/:farmId — Update editable fields ────────────────────────
const EDITABLE_FIELDS = ['farmName', 'village', 'primaryCrop', 'mapSnapshot', 'notes'];

router.patch('/:farmId', async (req, res) => {
  try {
    const updates = { updatedAt: new Date() };
    EDITABLE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const farm = await Farm
      .findOneAndUpdate({ farmId: req.params.farmId }, updates, { new: true, select: '-__v' })
      .lean();

    if (!farm) return res.status(404).json({ status: 'error', message: 'Farm not found.' });
    return res.json({ status: 'success', data: farm });
  } catch (err) {
    console.error('[PATCH /api/farms/:farmId]', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update farm.' });
  }
});

// ── DELETE /api/farms/:farmId — Soft delete ───────────────────────────────────
router.delete('/:farmId', async (req, res) => {
  try {
    const farm = await Farm
      .findOneAndUpdate(
        { farmId: req.params.farmId },
        { farmStatus: 'deleted', deletedAt: new Date(), updatedAt: new Date() },
        { new: true, select: '-__v' },
      )
      .lean();

    if (!farm) return res.status(404).json({ status: 'error', message: 'Farm not found.' });
    return res.json({ status: 'success', message: 'Farm deleted.', data: farm });
  } catch (err) {
    console.error('[DELETE /api/farms/:farmId]', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete farm.' });
  }
});

module.exports = router;
