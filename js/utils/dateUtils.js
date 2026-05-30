// ============================================
// NimbusIQ — Date Utility Helpers
// ============================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date string as "YYYY-MM-DD" for API calls
 */
export function toISODate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format date for display: "Wed, Apr 2"
 */
export function formatDate(date) {
  const d = new Date(date);
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Format full date: "Wednesday, April 2, 2026"
 */
export function formatFullDate(date) {
  const d = new Date(date);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format time from ISO string: "2:30 PM"
 */
export function formatTime(isoString) {
  const d = new Date(isoString);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

/**
 * Format hour: "2 PM", "12 AM"
 */
export function formatHour(isoString) {
  const d = new Date(isoString);
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours} ${ampm}`;
}

/**
 * Get day name from date: "Monday"
 */
export function getDayName(date) {
  return DAY_NAMES[new Date(date).getDay()];
}

/**
 * Get short day name: "Mon"
 */
export function getShortDayName(date) {
  return DAY_SHORT[new Date(date).getDay()];
}

/**
 * Get month name: "April"
 */
export function getMonthName(date) {
  return MONTH_NAMES[new Date(date).getMonth()];
}

/**
 * Get date N days ago as ISO string
 */
export function getDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

/**
 * Get date N months ago as ISO string
 */
export function getMonthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return toISODate(d);
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

/**
 * Get relative time: "2 hours ago", "in 3 days"
 */
export function relativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = (now - d) / 1000; // seconds
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return formatDate(date);
}

/**
 * Get current datetime formatted: "Wed, Apr 2, 10:30 PM"
 */
export function getCurrentDateTime() {
  const now = new Date();
  return `${formatDate(now)}, ${formatTime(now.toISOString())}`;
}
