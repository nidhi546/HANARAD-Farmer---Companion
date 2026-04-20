/**
 * FREE API KEYS CONFIGURATION
 * ─────────────────────────────────────────────────────────────────
 *
 * DATA.GOV.IN  (Mandi / Market Prices)
 *   → 100% Free. No credit card. Just register at:
 *     https://data.gov.in/user/register
 *   → After login go to: https://data.gov.in/api-registration
 *   → Copy your key and paste it below.
 *
 * OVERPASS / OPENSTREETMAP  (Nearby Stores)
 *   → No key needed at all. Always free.
 *
 * OPEN-METEO  (Weather / Irrigation)
 *   → No key needed at all. Always free.
 *
 * NASA POWER  (Historical Climate)
 *   → No key needed at all. Always free.
 * ─────────────────────────────────────────────────────────────────
 */

export const API_KEYS = {
  // Paste your FREE data.gov.in key here (no payment needed)
  DATA_GOV_IN: 'YOUR_FREE_KEY_HERE',
};

// Feature flags — set true once key is configured
export const FEATURES = {
  LIVE_MANDI_PRICES: API_KEYS.DATA_GOV_IN !== 'YOUR_FREE_KEY_HERE',
};
