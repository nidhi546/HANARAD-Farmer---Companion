const BASE = 'https://power.larc.nasa.gov/api';

// AbortSignal.timeout is not available in React Native — use this instead
function fetchWithTimeout(url, options = {}, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// Daily weather data (temp, rain, humidity, wind)
export const getDailyData = async (lat, lon, start, end) => {
  const url = `${BASE}/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS10M&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Daily data HTTP ${res.status}`);
  return res.json();
};

// Hourly weather data
export const getHourlyData = async (lat, lon, start, end) => {
  const url = `${BASE}/temporal/hourly/point?parameters=T2M,RH2M,WS10M,PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Hourly data HTTP ${res.status}`);
  return res.json();
};

// Monthly & annual averages
export const getMonthlyData = async (lat, lon, start, end) => {
  const url = `${BASE}/temporal/monthly/point?parameters=T2M,PRECTOTCORR,RH2M&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Monthly data HTTP ${res.status}`);
  return res.json();
};

// Long-term climatology averages
export const getClimatology = async (lat, lon) => {
  const url = `${BASE}/temporal/climatology/point?parameters=T2M,PRECTOTCORR,RH2M&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Climatology HTTP ${res.status}`);
  return res.json();
};

// Climate indicators (heat days, frost days, etc.)
export const getClimateIndicators = async (lat, lon, start, end) => {
  const url = `${BASE}/application/indicators/point?longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Indicators HTTP ${res.status}`);
  return res.json();
};

// Wind rose data
export const getWindRose = async (lat, lon, start, end) => {
  const url = `${BASE}/application/windrose/point?longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Wind rose HTTP ${res.status}`);
  return res.json();
};

// Climate zones
export const getClimateZones = async (lat, lon, start, end) => {
  const url = `${BASE}/application/zones/point?longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
  const res = await fetchWithTimeout(url, {}, 22000);
  if (!res.ok) throw new Error(`Climate zones HTTP ${res.status}`);
  return res.json();
};

// 7-day forecast from Open-Meteo
export const getOpenMeteoForecast = async (lat, lon) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto&forecast_days=7`;
  const res = await fetchWithTimeout(url, {}, 15000);
  if (!res.ok) throw new Error(`Forecast HTTP ${res.status}`);
  return res.json();
};

// NASA EONET — real disaster events near farmer's location (free, no key needed)
export const getEonetAlerts = async (lat, lon) => {
  const FARM_CATS = new Set(['drought', 'floods', 'severeStorms', 'wildfires', 'temperatureExtremes', 'dustHaze']);
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=50';
  const res  = await fetchWithTimeout(url, {}, 12000);
  const json = await res.json();

  return (json.events || [])
    .filter(event => {
      if (!event.categories?.some(c => FARM_CATS.has(c.id))) return false;
      const geo = event.geometry?.[0]?.coordinates;
      if (!geo) return false;
      const [eLon, eLat] = Array.isArray(geo[0]) ? geo[0] : geo;
      return _haversineKm(lat, lon, eLat, eLon) <= 500;
    })
    .map(event => {
      const catId = event.categories?.[0]?.id || '';
      return {
        type:     ['drought', 'wildfires', 'floods'].includes(catId) ? 'danger' : 'warning',
        key:      null,
        msg:      event.title,
        date:     event.geometry?.[0]?.date?.slice(0, 10) || 'Active',
        category: event.categories?.[0]?.title || 'Natural Event',
        source:   'NASA EONET',
      };
    });
};

function _haversineKm(lat1, lon1, lat2, lon2) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dN = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
