// ============================================
// NimbusIQ — LocalStorage Cache Service
// ============================================

const CACHE_PREFIX = 'nimbusiq_';
const DEFAULT_TTL = 30; // minutes

/**
 * Get a cached item. Returns null if expired or missing.
 */
export function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    const now = Date.now();

    if (now > entry.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set a cache entry with TTL in minutes
 */
export function setCache(key, data, ttlMinutes = DEFAULT_TTL) {
  try {
    const entry = {
      data,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // Storage full — evict oldest entries
    evictOldest();
    try {
      const entry = {
        data,
        expiry: Date.now() + ttlMinutes * 60 * 1000,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Silently fail
    }
  }
}

/**
 * Clear all NimbusIQ cache entries
 */
export function clearCache() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let count = 0;
  let totalSize = 0;
  let expired = 0;
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) {
      count++;
      const raw = localStorage.getItem(key);
      totalSize += raw.length * 2; // UTF-16

      try {
        const entry = JSON.parse(raw);
        if (now > entry.expiry) expired++;
      } catch { /* ignore */ }
    }
  }

  return {
    entries: count,
    expired,
    sizeBytes: totalSize,
    sizeFormatted: formatBytes(totalSize),
  };
}

/**
 * Evict the oldest cache entries
 */
function evictOldest() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        const entry = JSON.parse(raw);
        entries.push({ key, timestamp: entry.timestamp || 0 });
      } catch { /* ignore */ }
    }
  }

  // Sort oldest first, remove half
  entries.sort((a, b) => a.timestamp - b.timestamp);
  const removeCount = Math.max(1, Math.floor(entries.length / 2));
  for (let i = 0; i < removeCount; i++) {
    localStorage.removeItem(entries[i].key);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
