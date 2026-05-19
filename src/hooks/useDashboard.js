/**
 * useDashboard — single hook that powers the entire Home Screen.
 *
 * Sections managed:
 *   weather        Open-Meteo forecast (30-min AsyncStorage cache)
 *   alerts         Derived from weather thresholds via checkAlerts()
 *   features       Backend feature-grid config (24-h cache, defaults on error)
 *   expertConfig   Helpline details from backend (24-h cache, defaults on error)
 *   tips           Seasonal farm tips carousel (6-h cache, defaults on error)
 *   recommendations  Crop suggestions (2-h cache, hidden when empty)
 *   unreadCount    Unread notification badge count (no cache — always fresh)
 *
 * Loading strategy:
 *   • initialLoading is true only while the FIRST weather fetch is in flight.
 *     The full-screen spinner is driven by this flag alone, so the app feels
 *     fast — config / tips / recs load concurrently without blocking render.
 *   • Every section has its own error-safe fetch that never throws to callers.
 *   • refresh() force-busts all caches and re-fetches in parallel.
 *
 * Cache envelope: { data, timestamp } stored via the project's Storage utility.
 * TTL is checked client-side; no extra network call is needed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getOpenMeteoForecast } from '../api/powerApi';
import {
  getDashboardFeatures,
  getDashboardExpertConfig,
  getFarmTips,
  getCropRecommendations,
  DEFAULT_FEATURES,
  DEFAULT_EXPERT_CONFIG,
  DEFAULT_TIPS,
} from '../api/dashboardApi';
import { getUnreadCount } from '../api/notificationsApi';
import { checkAlerts } from '../utils/helpers';
import { Storage } from '../utils/storage';

// ── Cache keys ─────────────────────────────────────────────────────────────────
const CK = {
  weather:  (lat, lon) => `dash_wx_${lat}_${lon}`,
  features: 'dash_features_v1',
  expert:   'dash_expert_v1',
  tips:     (s)        => `dash_tips_${s}`,
  recs:     (s)        => `dash_recs_${s}`,
};

// ── TTLs (ms) ─────────────────────────────────────────────────────────────────
const TTL = {
  weather:  30  * 60 * 1000,   //  30 min
  features: 24  * 60 * 60 * 1000, // 24 h
  expert:   24  * 60 * 60 * 1000, // 24 h
  tips:      6  * 60 * 60 * 1000, //  6 h
  recs:      2  * 60 * 60 * 1000, //  2 h
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
async function readCache(key) {
  const stored = await Storage.get(key);
  return stored?.timestamp ? stored : null;
}

async function writeCache(key, data) {
  await Storage.set(key, { data, timestamp: Date.now() });
}

function isStale(cached, ttl) {
  return !cached || (Date.now() - cached.timestamp) > ttl;
}

// ── Season helper ─────────────────────────────────────────────────────────────
export function getCurrentSeason() {
  const m = new Date().getMonth() + 1; // 1–12
  if (m >= 6  && m <= 9)  return 'kharif'; // Jun–Sep
  if (m >= 10 || m <= 1)  return 'rabi';   // Oct–Jan
  return 'zaid';                            // Feb–May
}

// ─────────────────────────────────────────────────────────────────────────────

export default function useDashboard({ userId, location }) {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [weather,         setWeather]         = useState(null);
  const [alerts,          setAlerts]          = useState([]);
  const [features,        setFeatures]        = useState(DEFAULT_FEATURES);
  const [expertConfig,    setExpertConfig]    = useState(DEFAULT_EXPERT_CONFIG);
  const [tips,            setTips]            = useState(DEFAULT_TIPS);
  const [recommendations, setRecommendations] = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);

  // ── Loading / error state ───────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);  // full-screen spinner
  const [refreshing,     setRefreshing]     = useState(false);  // pull-to-refresh
  const [weatherError,   setWeatherError]   = useState(null);   // weather error banner

  // Prevent state updates after unmount
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  // ── Weather ───────────────────────────────────────────────────────────────
  const loadWeather = useCallback(async (force = false) => {
    if (!location?.lat) {
      if (alive.current) setInitialLoading(false);
      return;
    }

    const cKey = CK.weather(location.lat, location.lon);

    // Serve from cache if fresh
    if (!force) {
      const cached = await readCache(cKey);
      if (!isStale(cached, TTL.weather)) {
        if (alive.current) {
          setWeather(cached.data.weather);
          setAlerts(cached.data.alerts);
          setWeatherError(null);
          setInitialLoading(false);
        }
        return;
      }
    }

    setWeatherError(null);
    try {
      const raw = await getOpenMeteoForecast(location.lat, location.lon);
      const c   = raw.current;
      const d   = raw.daily;
      const w   = {
        temp:     c.temperature_2m?.toFixed(1)        ?? '--',
        max:      d.temperature_2m_max[0]?.toFixed(1) ?? '--',
        min:      d.temperature_2m_min[0]?.toFixed(1) ?? '--',
        rain:     c.precipitation?.toFixed(1)         ?? '0.0',
        humidity: c.relative_humidity_2m?.toFixed(0)  ?? '--',
        wind:     c.wind_speed_10m?.toFixed(1)        ?? '--',
        date:     d.time[0] ?? '',
      };
      const wa = checkAlerts(parseFloat(w.max), parseFloat(w.rain), parseFloat(w.wind));

      if (alive.current) {
        setWeather(w);
        setAlerts(wa);
        setWeatherError(null);
      }
      await writeCache(cKey, { weather: w, alerts: wa });
    } catch (e) {
      if (alive.current) {
        setWeatherError('Weather unavailable. Showing last known data.');
        // Serve stale cache rather than blank screen
        const stale = await readCache(cKey);
        if (stale?.data) {
          setWeather(stale.data.weather);
          setAlerts(stale.data.alerts);
        }
      }
    } finally {
      if (alive.current) setInitialLoading(false);
    }
  }, [location?.lat, location?.lon]);

  // ── Features + Expert config (parallel, non-blocking) ────────────────────
  const loadConfig = useCallback(async (force = false) => {
    if (!force) {
      const [fc, ec] = await Promise.all([readCache(CK.features), readCache(CK.expert)]);
      if (!isStale(fc, TTL.features) && !isStale(ec, TTL.expert)) {
        if (alive.current) {
          setFeatures(fc.data);
          setExpertConfig(ec.data);
        }
        return;
      }
    }

    const [feats, expert] = await Promise.allSettled([
      getDashboardFeatures(),
      getDashboardExpertConfig(),
    ]);

    if (alive.current) {
      if (feats.status === 'fulfilled') {
        setFeatures(feats.value);
        await writeCache(CK.features, feats.value);
      }
      if (expert.status === 'fulfilled') {
        setExpertConfig(expert.value);
        await writeCache(CK.expert, expert.value);
      }
    }
  }, []);

  // ── Farm tips ─────────────────────────────────────────────────────────────
  const loadTips = useCallback(async (force = false) => {
    const season = getCurrentSeason();
    const cKey   = CK.tips(season);

    if (!force) {
      const cached = await readCache(cKey);
      if (!isStale(cached, TTL.tips)) {
        if (alive.current) setTips(cached.data);
        return;
      }
    }

    try {
      const data = await getFarmTips({ season });
      if (alive.current) {
        setTips(data);
        await writeCache(cKey, data);
      }
    } catch {}
  }, []);

  // ── Crop recommendations ──────────────────────────────────────────────────
  const loadRecommendations = useCallback(async (force = false) => {
    const season = getCurrentSeason();
    const cKey   = CK.recs(season);

    if (!force) {
      const cached = await readCache(cKey);
      if (!isStale(cached, TTL.recs)) {
        if (alive.current) setRecommendations(cached.data);
        return;
      }
    }

    try {
      const data = await getCropRecommendations({ season });
      if (alive.current) {
        setRecommendations(data);
        await writeCache(cKey, data);
      }
    } catch {}
  }, []);

  // ── Notification count (no cache — must always be fresh) ──────────────────
  const loadNotifCount = useCallback(async () => {
    if (!userId) return;
    const count = await getUnreadCount(userId);
    if (alive.current) setUnreadCount(count);
  }, [userId]);

  // ── Initial load — weather blocks UI, rest run in parallel ───────────────
  useEffect(() => {
    loadWeather();
    loadConfig();
    loadTips();
    loadRecommendations();
    loadNotifCount();
  }, [loadWeather, loadConfig, loadTips, loadRecommendations, loadNotifCount]);

  // ── Pull-to-refresh — force-busts all caches ─────────────────────────────
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      loadWeather(true),
      loadConfig(true),
      loadTips(true),
      loadRecommendations(true),
      loadNotifCount(),
    ]);
    if (alive.current) setRefreshing(false);
  }, [loadWeather, loadConfig, loadTips, loadRecommendations, loadNotifCount]);

  return {
    // ── Data ────────────────────────────────────────────────────────────────
    weather,
    alerts,
    features,
    expertConfig,
    tips,
    recommendations,
    unreadCount,
    // ── Loading ─────────────────────────────────────────────────────────────
    initialLoading,   // true only on first load; drives the full-screen spinner
    refreshing,       // true during pull-to-refresh
    weatherError,     // non-null string if weather fetch failed
    // ── Actions ─────────────────────────────────────────────────────────────
    refresh,
    reloadNotifCount: loadNotifCount,
  };
}
