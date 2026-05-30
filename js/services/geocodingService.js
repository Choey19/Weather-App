// ============================================
// NimbusIQ — Geocoding Service
// ============================================

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const STORAGE_KEY = 'nimbusiq_default_city';

// Default city: Delhi
const DEFAULT_CITY = {
  name: 'New Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  country: 'India',
  admin1: 'Delhi',
};

/**
 * Search for cities by name. Returns array of results.
 */
export async function searchCity(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `${GEO_API}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('Geocoding API error');

    const data = await res.json();

    if (!data.results) return [];

    return data.results.map((r) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country || '',
      admin1: r.admin1 || '',
      country_code: r.country_code || '',
      population: r.population || 0,
      timezone: r.timezone || '',
    }));
  } catch (err) {
    console.error('Geocoding error:', err);
    return [];
  }
}

/**
 * Get the saved default city, or return Delhi
 */
export function getDefaultCity() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { ...DEFAULT_CITY };
}

/**
 * Save a city as the default
 */
export function saveDefaultCity(city) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country,
      admin1: city.admin1,
    }));
  } catch { /* ignore */ }
}

/**
 * Format city for display: "New Delhi, Delhi, India"
 */
export function formatCityName(city) {
  const parts = [city.name];
  if (city.admin1 && city.admin1 !== city.name) parts.push(city.admin1);
  if (city.country) parts.push(city.country);
  return parts.join(', ');
}
