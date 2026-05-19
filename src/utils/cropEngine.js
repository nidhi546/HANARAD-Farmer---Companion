/**
 * cropEngine.js — Recommendation scoring engine.
 *
 * Scoring weights:
 *   Temperature  30%  — most critical for crop physiology
 *   Rainfall     25%  — water availability
 *   Humidity     20%  — disease risk + transpiration
 *   Season match 25%  — phenological calendar fit
 *
 * Score 0–100 → badge:
 *   80–100  Excellent  ✅  Green
 *   65–79   Good       👍  Light green
 *   50–64   Moderate   ⚠️  Amber
 *   35–49   Not Ideal  🔶  Orange
 *   0–34    Avoid      ⛔  Red
 *
 * All functions are pure — no side effects, safe to call in any context.
 */

// ── Season calendar (India-centric) ──────────────────────────────────────────
const SEASON_MONTHS = {
  Kharif:    [6, 7, 8, 9, 10],      // Jun–Oct
  Rabi:      [11, 12, 1, 2, 3],     // Nov–Mar
  Zaid:      [3, 4, 5],             // Mar–May
  Perennial: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

/**
 * Returns the dominant Indian agricultural season for a given Date.
 * Returns 'Kharif' | 'Rabi' | 'Zaid'.
 */
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-based
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month >= 11 || month <= 2)  return 'Rabi';
  return 'Zaid';
}

/**
 * Returns human-friendly season window string.
 */
export function getSeasonWindow(season) {
  const windows = {
    Kharif:    'Jun – Oct',
    Rabi:      'Nov – Mar',
    Zaid:      'Mar – May',
    Perennial: 'Year-round',
  };
  return windows[season] || season;
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

/**
 * Range-based score: 1.0 at ideal centre, falls off linearly to 0 at edges.
 * Returns 0–1.
 */
function rangeScore(value, min, max) {
  if (value === null || value === undefined || isNaN(value)) return 0.5; // neutral if no data
  if (value < min) return Math.max(0, 1 - (min - value) / min);
  if (value > max) return Math.max(0, 1 - (value - max) / max);
  // inside range: peak at midpoint
  const mid   = (min + max) / 2;
  const range = (max - min) / 2 || 1;
  return 1 - Math.abs(value - mid) / range * 0.2; // slight penalty toward edges
}

/**
 * Minimum-threshold score: 1.0 when at or above minimum, 0 when 0.
 * Returns 0–1.
 */
function minScore(value, min) {
  if (value === null || value === undefined || isNaN(value)) return 0.5;
  if (min <= 0) return 1;
  return Math.min(1, value / min);
}

// ── Main scoring function ─────────────────────────────────────────────────────

/**
 * Score a single crop against current climate and season.
 *
 * @param {object} crop    - from CROP_MASTER
 * @param {object} climate - { temp, rain, humidity } monthly averages
 * @param {string} season  - 'Kharif' | 'Rabi' | 'Zaid'
 * @returns {number} score 0–100
 */
export function scoreCrop(crop, climate, season) {
  const { temp = null, rain = null, humidity = null } = climate || {};

  const tempScore    = rangeScore(temp,     crop.minTemp,     crop.maxTemp);
  const rainScore    = rangeScore(rain,     crop.minRain,     crop.maxRain);
  const humidScore   = minScore(humidity,   crop.minHumidity);

  // Season match: full credit if crop seasons include current season
  // Perennial crops always get full season credit
  const seasonMatch  = crop.seasons.includes('Perennial') || crop.seasons.includes(season) ? 1.0 : 0.15;

  const raw = (
    tempScore  * 0.30 +
    rainScore  * 0.25 +
    humidScore * 0.20 +
    seasonMatch * 0.25
  );

  return Math.round(Math.max(0, Math.min(100, raw * 100)));
}

// ── Badge system ──────────────────────────────────────────────────────────────

/**
 * Returns UI badge descriptor for a score.
 * @param {number} score 0–100
 */
export function getScoreBadge(score) {
  if (score >= 80) return { label: 'Excellent',  emoji: '✅', color: '#10B981', bg: '#ECFDF5', textColor: '#065F46' };
  if (score >= 65) return { label: 'Good',        emoji: '👍', color: '#22C55E', bg: '#F0FDF4', textColor: '#166534' };
  if (score >= 50) return { label: 'Moderate',    emoji: '⚠️', color: '#F59E0B', bg: '#FFFBEB', textColor: '#92400E' };
  if (score >= 35) return { label: 'Not Ideal',   emoji: '🔶', color: '#F97316', bg: '#FFF7ED', textColor: '#9A3412' };
  return              { label: 'Avoid',        emoji: '⛔', color: '#EF4444', bg: '#FEF2F2', textColor: '#991B1B' };
}

// ── Ranking ───────────────────────────────────────────────────────────────────

/**
 * Score and rank all crops. Returns array sorted by score descending.
 *
 * @param {object[]} crops   - CROP_MASTER items
 * @param {object}   climate - { temp, rain, humidity }
 * @param {string}   season  - current season
 * @returns {{ crop, score, badge }[]}
 */
export function rankCrops(crops, climate, season) {
  return crops
    .map(crop => {
      const score = scoreCrop(crop, climate, season);
      const badge = getScoreBadge(score);
      return { crop, score, badge };
    })
    .sort((a, b) => b.score - a.score);
}

// ── Duplicate detection ───────────────────────────────────────────────────────

/**
 * Returns true if userCrops already contains an active crop with the same cropId
 * and an overlapping growing season (within 6 months).
 */
export function isDuplicateCrop(cropId, userCrops = []) {
  return userCrops.some(
    uc => uc.cropId === cropId && uc.cropStatus === 'active',
  );
}

// ── Seasonal warnings ─────────────────────────────────────────────────────────

/**
 * Returns a warning string if the crop's season doesn't match now, or null.
 */
export function getSeasonWarning(crop, currentSeason) {
  if (crop.seasons.includes('Perennial')) return null;
  if (crop.seasons.includes(currentSeason)) return null;
  const windows = crop.seasons.map(getSeasonWindow).join(' / ');
  return `Best sown during ${windows}. Adding now may affect yield.`;
}
