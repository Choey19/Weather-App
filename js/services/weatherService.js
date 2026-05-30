// ============================================
// NimbusIQ — Weather Service (Open-Meteo API)
// ============================================

import { getCached, setCache } from './cacheService.js';

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive';
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// Weather code → description & emoji mapping
const WEATHER_CODES = {
  0: { desc: 'Clear Sky', icon: '☀️', night: '🌙' },
  1: { desc: 'Mainly Clear', icon: '🌤️', night: '🌙' },
  2: { desc: 'Partly Cloudy', icon: '⛅', night: '☁️' },
  3: { desc: 'Overcast', icon: '☁️', night: '☁️' },
  45: { desc: 'Fog', icon: '🌫️', night: '🌫️' },
  48: { desc: 'Rime Fog', icon: '🌫️', night: '🌫️' },
  51: { desc: 'Light Drizzle', icon: '🌦️', night: '🌧️' },
  53: { desc: 'Drizzle', icon: '🌦️', night: '🌧️' },
  55: { desc: 'Dense Drizzle', icon: '🌧️', night: '🌧️' },
  61: { desc: 'Slight Rain', icon: '🌦️', night: '🌧️' },
  63: { desc: 'Moderate Rain', icon: '🌧️', night: '🌧️' },
  65: { desc: 'Heavy Rain', icon: '🌧️', night: '🌧️' },
  66: { desc: 'Freezing Rain', icon: '🌨️', night: '🌨️' },
  67: { desc: 'Heavy Freezing Rain', icon: '🌨️', night: '🌨️' },
  71: { desc: 'Slight Snow', icon: '🌨️', night: '🌨️' },
  73: { desc: 'Moderate Snow', icon: '❄️', night: '❄️' },
  75: { desc: 'Heavy Snow', icon: '❄️', night: '❄️' },
  77: { desc: 'Snow Grains', icon: '❄️', night: '❄️' },
  80: { desc: 'Slight Showers', icon: '🌦️', night: '🌧️' },
  81: { desc: 'Moderate Showers', icon: '🌧️', night: '🌧️' },
  82: { desc: 'Violent Showers', icon: '⛈️', night: '⛈️' },
  85: { desc: 'Slight Snow Showers', icon: '🌨️', night: '🌨️' },
  86: { desc: 'Heavy Snow Showers', icon: '❄️', night: '❄️' },
  95: { desc: 'Thunderstorm', icon: '⛈️', night: '⛈️' },
  96: { desc: 'Thunderstorm + Hail', icon: '⛈️', night: '⛈️' },
  99: { desc: 'Thunderstorm + Heavy Hail', icon: '⛈️', night: '⛈️' },
};

/**
 * Parse weather code to description and icon
 */
export function getWeatherInfo(code, isNight = false) {
  const info = WEATHER_CODES[code] || { desc: 'Unknown', icon: '🌈', night: '🌈' };
  return {
    description: info.desc,
    icon: isNight ? info.night : info.icon,
  };
}

/**
 * Check if current time is night
 */
function isNightTime(sunrise, sunset) {
  const now = new Date();
  const sunriseTime = new Date(sunrise);
  const sunsetTime = new Date(sunset);
  return now < sunriseTime || now > sunsetTime;
}

/**
 * Get current weather + today's forecast
 */
export async function getCurrentWeather(lat, lon) {
  const cacheKey = `current_${lat}_${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'is_day', 'precipitation', 'rain', 'weather_code',
      'cloud_cover', 'pressure_msl', 'surface_pressure',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'sunrise', 'sunset', 'uv_index_max',
      'precipitation_sum', 'wind_speed_10m_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: 1,
  });

  const data = await fetchAPI(`${FORECAST_API}?${params}`);

  const result = {
    current: {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      precipitation: data.current.precipitation,
      ...getWeatherInfo(data.current.weather_code, !data.current.is_day),
    },
    today: {
      tempMax: data.daily.temperature_2m_max[0],
      tempMin: data.daily.temperature_2m_min[0],
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      uvIndex: data.daily.uv_index_max[0],
      precipSum: data.daily.precipitation_sum[0],
      windMax: data.daily.wind_speed_10m_max[0],
    },
    units: data.current_units,
    timezone: data.timezone,
  };

  setCache(cacheKey, result, 15); // 15 min cache
  return result;
}

/**
 * Get hourly forecast
 */
export async function getHourlyForecast(lat, lon, days = 2) {
  const cacheKey = `hourly_${lat}_${lon}_${days}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation_probability', 'precipitation', 'weather_code',
      'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m',
      'uv_index', 'is_day',
    ].join(','),
    timezone: 'auto',
    forecast_days: days,
  });

  const data = await fetchAPI(`${FORECAST_API}?${params}`);

  const hours = data.hourly.time.map((time, i) => ({
    time,
    temp: data.hourly.temperature_2m[i],
    feelsLike: data.hourly.apparent_temperature[i],
    humidity: data.hourly.relative_humidity_2m[i],
    precipProb: data.hourly.precipitation_probability[i],
    precipitation: data.hourly.precipitation[i],
    weatherCode: data.hourly.weather_code[i],
    cloudCover: data.hourly.cloud_cover[i],
    visibility: data.hourly.visibility[i],
    windSpeed: data.hourly.wind_speed_10m[i],
    windDir: data.hourly.wind_direction_10m[i],
    uvIndex: data.hourly.uv_index[i],
    isDay: data.hourly.is_day[i],
    ...getWeatherInfo(data.hourly.weather_code[i], !data.hourly.is_day[i]),
  }));

  setCache(cacheKey, hours, 30);
  return hours;
}

/**
 * Get daily forecast (7 or 16 days)
 */
export async function getDailyForecast(lat, lon, days = 7) {
  const cacheKey = `daily_${lat}_${lon}_${days}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'apparent_temperature_max', 'apparent_temperature_min',
      'sunrise', 'sunset', 'uv_index_max',
      'precipitation_sum', 'precipitation_probability_max',
      'wind_speed_10m_max', 'wind_direction_10m_dominant',
    ].join(','),
    timezone: 'auto',
    forecast_days: Math.min(days, 16),
  });

  const data = await fetchAPI(`${FORECAST_API}?${params}`);

  const result = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    feelsMax: data.daily.apparent_temperature_max[i],
    feelsMin: data.daily.apparent_temperature_min[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
    uvIndex: data.daily.uv_index_max[i],
    precipSum: data.daily.precipitation_sum[i],
    precipProb: data.daily.precipitation_probability_max[i],
    windMax: data.daily.wind_speed_10m_max[i],
    windDir: data.daily.wind_direction_10m_dominant[i],
    ...getWeatherInfo(data.daily.weather_code[i]),
  }));

  setCache(cacheKey, result, 60);
  return result;
}

/**
 * Get historical weather data
 */
export async function getHistoricalWeather(lat, lon, startDate, endDate) {
  const cacheKey = `hist_${lat}_${lon}_${startDate}_${endDate}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: endDate,
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'temperature_2m_mean', 'precipitation_sum',
      'wind_speed_10m_max', 'wind_direction_10m_dominant',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'auto',
  });

  const data = await fetchAPI(`${ARCHIVE_API}?${params}`);

  const result = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    tempMean: data.daily.temperature_2m_mean[i],
    precipSum: data.daily.precipitation_sum[i],
    windMax: data.daily.wind_speed_10m_max[i],
    windDir: data.daily.wind_direction_10m_dominant[i],
    ...getWeatherInfo(data.daily.weather_code?.[i]),
  }));

  setCache(cacheKey, result, 1440); // cache historical for 24 hours
  return result;
}

/**
 * Get air quality data
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `aqi_${lat}_${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'european_aqi', 'us_aqi',
      'pm10', 'pm2_5', 'carbon_monoxide',
      'nitrogen_dioxide', 'sulphur_dioxide', 'ozone',
    ].join(','),
    hourly: 'us_aqi',
    forecast_days: 5,
    timezone: 'auto',
  });

  const data = await fetchAPI(`${AIR_QUALITY_API}?${params}`);

  const result = {
    current: {
      europeanAqi: data.current.european_aqi,
      usAqi: data.current.us_aqi,
      pm10: data.current.pm10,
      pm25: data.current.pm2_5,
      co: data.current.carbon_monoxide,
      no2: data.current.nitrogen_dioxide,
      so2: data.current.sulphur_dioxide,
      o3: data.current.ozone,
    },
    hourly: data.hourly.time.map((t, i) => ({
      time: t,
      aqi: data.hourly.us_aqi[i],
    })),
  };

  setCache(cacheKey, result, 30);
  return result;
}

/**
 * Get AQI level info
 */
export function getAQILevel(aqi) {
  if (aqi <= 50) return { level: 'Good', color: '#34d399', advice: 'Air quality is satisfactory.' };
  if (aqi <= 100) return { level: 'Moderate', color: '#fbbf24', advice: 'Acceptable for most people.' };
  if (aqi <= 150) return { level: 'Unhealthy (Sensitive)', color: '#fb923c', advice: 'Sensitive groups may be affected.' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#fb7185', advice: 'Everyone may experience effects.' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#a855f7', advice: 'Health alert: serious effects.' };
  return { level: 'Hazardous', color: '#ef4444', advice: 'Emergency conditions.' };
}

/**
 * Get wind direction as compass label
 */
export function getWindDirection(degrees) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

/**
 * Internal fetch with error handling
 */
async function fetchAPI(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.reason || `API error: ${res.status}`);
  }
  return res.json();
}
