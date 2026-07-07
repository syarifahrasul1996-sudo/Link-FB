// src/utils/localStorageHelper.ts

/**
 * Safely loads and parses data from localStorage.
 * If parsing fails, or if a validator function is provided and returns false,
 * it removes the corrupted key from localStorage and returns the fallback value.
 *
 * @param key The localStorage key.
 * @param fallback The fallback value to return on failure or absence.
 * @param validator Optional callback to validate the parsed object's structure.
 */
export function safeLoadFromStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: any) => boolean
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) {
      console.warn(`Validation failed for localStorage key "${key}". Resetting to fallback.`);
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed as T;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    try {
      localStorage.removeItem(key);
    } catch (removeErr) {
      // Ignored in case of restricted sandboxed environments
    }
    return fallback;
  }
}
