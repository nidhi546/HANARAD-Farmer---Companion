/**
 * cropValidator.js — Validation, normalization, and ID generation
 *                    for crop master and user crop forms.
 *
 * Pure functions — no side effects, no imports. Safe to call anywhere.
 */

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a crop name to Title Case with single spaces.
 * e.g. " dragon  fruit " → "Dragon Fruit"
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeCropName(name = '') {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse a comma-separated string into a trimmed, non-empty string array.
 * e.g. "Pitaya, Kamalam,  " → ["Pitaya", "Kamalam"]
 *
 * @param {string} str
 * @returns {string[]}
 */
export function parseCommaSeparated(str = '') {
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a stable, unique document ID for a new crop master entry.
 * Format: crop_{userId}_{timestamp}_{5-char random}
 *
 * @param {string} userId
 * @returns {string}
 */
export function generateCropDocId(userId) {
  const rand = Math.random().toString(36).slice(2, 7);
  return `crop_${userId}_${Date.now()}_${rand}`;
}

/**
 * Generate a document ID for a user crop record.
 * Format: {userId}_{timestamp}_{5-char random}
 *
 * @param {string} userId
 * @returns {string}
 */
export function generateUserCropDocId(userId) {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${userId}_${Date.now()}_${rand}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — CROP MASTER FORM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate the Add Crop Master form.
 *
 * Required: cropName, cropCategory, cropSeason (at least one)
 * Optional: all other fields
 *
 * @param {{ cropName: string, cropCategory: string|null, cropSeason: string[] }} data
 * @returns {object} errors — empty object means valid
 */
export function validateCropMasterForm({ cropName, cropCategory, cropSeason }) {
  const errors = {};
  const name = (cropName || '').trim();

  if (!name) {
    errors.cropName = 'Crop name is required.';
  } else if (name.length < 2) {
    errors.cropName = 'Name must be at least 2 characters.';
  } else if (name.length > 80) {
    errors.cropName = 'Name is too long (max 80 characters).';
  } else if (!/^[a-zA-Z0-9\s\-'().]+$/.test(name)) {
    errors.cropName = 'Name contains invalid characters.';
  }

  if (!cropCategory) {
    errors.cropCategory = 'Please select a category.';
  }

  if (!cropSeason || cropSeason.length === 0) {
    errors.cropSeason = 'Please select at least one season.';
  }

  return errors;
}

/**
 * Validate the Add User Crop form (selecting from picker).
 *
 * @param {{ cropName: string, cropId: string|null }} data
 * @returns {object} errors
 */
export function validateUserCropForm({ cropName, cropId }) {
  const errors = {};
  if (!cropId && !(cropName || '').trim()) {
    errors.crop = 'Please select a crop or enter a custom name.';
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the final API payload body for adding a new crop to the master.
 * Strips null/empty optional fields to keep documents clean.
 *
 * @param {object} formData - raw form state
 * @returns {object}        - cleaned payload body
 */
export function buildCropMasterPayload(formData) {
  const {
    cropName, scientificName, localNames, cropCategory,
    cropSeason, soilTypes, waterRequirement,
    tempMin, tempMax, humMin, humMax, rainMin, rainMax,
    cropDurationDays, statesSupported, icon,
  } = formData;

  const payload = {
    cropName:    normalizeCropName(cropName),
    cropCategory,
    cropSeason:  cropSeason || [],
    soilTypes:   soilTypes  || [],
    icon:        icon       || '🌱',
  };

  if (scientificName?.trim()) payload.scientificName = scientificName.trim();
  if (localNames?.length)     payload.localNames     = localNames;
  if (waterRequirement)       payload.waterRequirement = waterRequirement;

  if (tempMin || tempMax) {
    payload.temperatureRange = {
      min: tempMin ? parseFloat(tempMin) : null,
      max: tempMax ? parseFloat(tempMax) : null,
    };
  }
  if (humMin || humMax) {
    payload.humidityRange = {
      min: humMin ? parseFloat(humMin) : null,
      max: humMax ? parseFloat(humMax) : null,
    };
  }
  if (rainMin || rainMax) {
    payload.rainfallRange = {
      min: rainMin ? parseFloat(rainMin) : null,
      max: rainMax ? parseFloat(rainMax) : null,
    };
  }
  if (cropDurationDays) payload.cropDurationDays = parseInt(cropDurationDays, 10);
  if (statesSupported?.length) payload.statesSupported = statesSupported;

  return payload;
}
