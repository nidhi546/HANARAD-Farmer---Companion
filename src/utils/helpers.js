import { format } from 'date-fns';

export const today = () => format(new Date(), 'yyyyMMdd');
export const daysAgo = (n) => format(new Date(Date.now() - n * 86400000), 'yyyyMMdd');
export const formatDate = (str) => format(new Date(str), 'MMM dd');

export const getWeatherIcon = (temp, rain) => {
  if (rain > 10) return '🌧️';
  if (rain > 3) return '🌦️';
  if (temp > 35) return '☀️🔥';
  if (temp > 28) return '☀️';
  if (temp < 15) return '🥶';
  return '⛅';
};

// Returns translation keys — callers must call t(alert.key) to get localised text.
export const checkAlerts = (maxTemp, rain, wind, minTemp = 99) => {
  const alerts = [];
  if (maxTemp > 42)  alerts.push({ type: 'danger',  key: 'heatWaveAlert'     });
  if (maxTemp > 40)  alerts.push({ type: 'danger',  key: 'extremeHeatAlert'  });
  if (rain > 50)     alerts.push({ type: 'danger',  key: 'heavyRainAlert'    });
  if (minTemp < 4)   alerts.push({ type: 'danger',  key: 'frostAlert'        });
  if (wind > 10)     alerts.push({ type: 'warning', key: 'strongWindAlert'   });
  if (maxTemp > 35)  alerts.push({ type: 'warning', key: 'highTempAlert'     });
  if (rain > 20)     alerts.push({ type: 'warning', key: 'moderateRainAlert' });
  return alerts;
};
