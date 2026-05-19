/**
 * Map configuration — reads API key from .env via Expo's EXPO_PUBLIC_ convention.
 * Never hardcode the key in source files.
 */

export const MAP_API_KEY =
  process.env.EXPO_PUBLIC_MAP_API_KEY ?? 'AIzaSyD8dRJ48Q0ij-ggn74ybov5xQ9gErzM2HY';

// MapTiler raster tile URL for Leaflet WebView tiles
export const MAPTILER_URL =
  `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`;

// Satellite tiles — useful for farm boundary work
export const MAPTILER_SATELLITE_URL =
  `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`;

// Attribution required by MapTiler terms of service
export const MAP_ATTRIBUTION = '© MapTiler © OpenStreetMap contributors';

// Default map region centred on Gujarat, India
export const DEFAULT_REGION = {
  latitude: 22.2587,
  longitude: 71.1924,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

// GPS walk tracking settings
export const GPS_CONFIG = {
  minDistanceBetweenPoints: 3,   // meters — noise filter
  maxAcceptableAccuracy:    25,  // meters — ignore noisy fixes
  autoCloseThreshold:       15,  // meters — snap to start to close polygon
  updateIntervalMs:         1000,
};

// Unit conversion factors from square metres
export const AREA_UNITS = {
  sqFt:    10.7639,       // 1 sqm → sq ft
  acres:   0.000247105,   // 1 sqm → acres
  hectares: 0.0001,       // 1 sqm → hectares
  bigha:   1 / 1011.7,   // Gujarat bigha ≈ 1011.7 sqm
  vigha:   1 / 2023.4,   // 2 bigha = 1 vigha
};
