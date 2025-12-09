/**
 * Vietnam Time (UTC+7) utility functions
 *
 * IMPORTANT: Always use these functions instead of `new Date()` to ensure
 * all timestamps are in Vietnam timezone (Asia/Ho_Chi_Minh)
 *
 * ✅ TypeORM Configuration: timezone is set to 'Asia/Ho_Chi_Minh' in app.module.ts
 * This means PostgreSQL automatically handles timezone conversion:
 * - When saving: Converts VN time → UTC in DB
 * - When reading: Converts UTC → VN time
 *
 * So we just need to provide current local time, PostgreSQL handles the rest.
 */

/**
 * Get current date and time in Vietnam timezone (UTC+7)
 *
 * IMPORTANT: Cannot rely on server's local timezone in Docker containers.
 * Must manually calculate Vietnam time by adding 7 hours to UTC.
 *
 * @returns Date object representing current time in Vietnam timezone
 */
export function getVietnamTime(): Date {
  const now = new Date();
  // Get UTC time in milliseconds and add 7 hours (25200000 ms = 7 * 60 * 60 * 1000)
  const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vietnamTime;
}

/**
 * Convert any Date to Vietnam timezone
 * @param date - Date to convert
 * @returns Date object in Vietnam timezone
 */
export function toVietnamTime(date: Date): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  const vietnamTime = new Date(utcTime + 7 * 3600000);
  return vietnamTime;
}

/**
 * Get current date in Vietnam timezone as ISO string (YYYY-MM-DD)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getVietnamDate(): string {
  return getVietnamTime().toISOString().split('T')[0];
}

/**
 * Get current Vietnam time as ISO string (Vietnam time, NOT UTC)
 *
 * IMPORTANT: This returns a Vietnam time ISO string, NOT a UTC ISO string.
 * The Date object's .toISOString() always returns UTC, so we manually format it.
 *
 * @returns ISO timestamp string in Vietnam timezone
 */
export function getVietnamISOString(): string {
  const vietnamDate = getVietnamTime();
  // Format as ISO string but preserve Vietnam time
  // Instead of using toISOString() which converts to UTC,
  // we manually format it to show the adjusted time
  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
  const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
  const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(vietnamDate.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(vietnamDate.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

/**
 * Parse string date to Vietnam timezone Date object
 * @param dateString - Date string (YYYY-MM-DD or ISO format)
 * @returns Date object in Vietnam timezone
 */
export function parseToVietnamTime(dateString: string): Date {
  const parsedDate = new Date(dateString);
  return toVietnamTime(parsedDate);
}

/**
 * Get start of day in Vietnam timezone (00:00:00)
 * @param date - Optional date (defaults to today)
 * @returns Date object at start of day in Vietnam timezone
 */
export function getVietnamStartOfDay(date?: Date): Date {
  const targetDate = date ? toVietnamTime(date) : getVietnamTime();
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Get end of day in Vietnam timezone (23:59:59.999)
 * @param date - Optional date (defaults to today)
 * @returns Date object at end of day in Vietnam timezone
 */
export function getVietnamEndOfDay(date?: Date): Date {
  const targetDate = date ? toVietnamTime(date) : getVietnamTime();
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
}

/**
 * Format Vietnam time to readable string
 * @param date - Date to format
 * @returns Formatted string (e.g., "2025-12-09 14:30:45")
 */
export function formatVietnamTime(date: Date): string {
  const vietnamDate = toVietnamTime(date);
  return vietnamDate.toISOString().replace('T', ' ').substring(0, 19);
}
