/**
 * MANDI / MARKET PRICE API
 * ─────────────────────────────────────────────────────────────────
 * Source : data.gov.in  →  AGMARKNET daily commodity prices
 * Cost   : FREE  (free API key, no credit card)
 * Register: https://data.gov.in/user/register
 * ─────────────────────────────────────────────────────────────────
 *
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 * Fields: State, District, Market, Commodity, Variety, Arrival_Date,
 *         Min_Price, Max_Price, Modal_Price (₹ per quintal)
 */

import { API_KEYS, FEATURES } from '../config/apiKeys';
import { MANDI_DATA } from '../constants/mandiData';

const BASE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

/**
 * Fetch live mandi prices from data.gov.in.
 * Falls back to local MANDI_DATA if key is not configured.
 *
 * @param {string} state  - e.g. 'Gujarat'
 * @param {string} [commodity] - e.g. 'Cotton' (optional filter)
 * @returns {Promise<Array>} - Array of price records
 */
export async function getLivePrices(state = 'Gujarat', commodity = '') {
  if (!FEATURES.LIVE_MANDI_PRICES) {
    // Return static fallback data (already in mandiData.js)
    return buildStaticResponse(state);
  }

  try {
    let url = `${BASE}?api-key=${API_KEYS.DATA_GOV_IN}&format=json&limit=100&filters[State]=${encodeURIComponent(state)}`;
    if (commodity) url += `&filters[Commodity]=${encodeURIComponent(commodity)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res  = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    const json = await res.json();

    if (!json.records || json.records.length === 0) {
      return buildStaticResponse(state);
    }

    // Normalize to a consistent shape
    return json.records.map(r => ({
      market:    r.Market   || r.market    || '–',
      district:  r.District || r.district  || '–',
      commodity: r.Commodity|| r.commodity || '–',
      variety:   r.Variety  || r.variety   || '–',
      date:      r.Arrival_Date || r.arrival_date || '–',
      minPrice:  parseFloat(r.Min_Price   || r.min_price   || 0),
      maxPrice:  parseFloat(r.Max_Price   || r.max_price   || 0),
      modalPrice:parseFloat(r.Modal_Price || r.modal_price || 0),
      isLive: true,
    }));

  } catch (err) {
    console.log('MandiApi error — using local fallback:', err.message);
    return buildStaticResponse(state);
  }
}

/** Convert mandiData.js structure → same shape as live API */
function buildStaticResponse(state) {
  const rows = [];
  MANDI_DATA.forEach(market => {
    market.crops.forEach(crop => {
      rows.push({
        market:     market.name,
        district:   market.district,
        commodity:  crop.name,
        variety:    'Local',
        date:       new Date().toLocaleDateString('en-IN'),
        minPrice:   Math.round(crop.price * 0.95),
        maxPrice:   Math.round(crop.price * 1.05),
        modalPrice: crop.price,
        trend:      crop.trend,
        isLive:     false,  // flag so UI can show "sample data" badge
      });
    });
  });
  return rows;
}
