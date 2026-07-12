// utils/timezone.ts

/**
 * Returns the current date string in Malaysia time zone (Asia/Kuala_Lumpur)
 * format: YYYY-MM-DD
 */
export function getMalaysiaDateString(): string {
  try {
    const d = new Date();
    // 'en-CA' locale produces 'YYYY-MM-DD' format reliably in standard environments
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
  } catch (e) {
    console.error("[Timezone Error] Failed to format Malaysia date using en-CA locale:", e);
  }

  // Fallback to parts-based formatting
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("[Timezone Error] Fallback parts formatter failed:", e);
  }

  // Absolute baseline fallback: local system date (not perfect for Malaysia, but format-safe)
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Calculates milliseconds remaining until the next Malaysian midnight (Asia/Kuala_Lumpur).
 * Malaysian midnight corresponds to exactly 16:00:00 UTC.
 */
export function getMsUntilMalaysiaMidnight(): number {
  const now = new Date();
  
  // Set target to today at 16:00:00 UTC (00:00:00 Malaysia time of tomorrow or today)
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    16, 0, 0, 0
  ));
  
  // If we are already past 16:00:00 UTC, the next Malaysia midnight is 16:00:00 UTC the following day
  if (now.getTime() >= target.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

/**
 * Formats milliseconds into a human readable countdown hh:mm:ss
 */
export function formatMillisecondsToCountdown(ms: number): string {
  if (ms < 0) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}
