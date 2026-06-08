import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string without shifting by timezone. yyyy-MM-dd strings are
 * treated as a local date (e.g. "2026-06-15" → local midnight on June 15),
 * not UTC midnight — otherwise users in UTC-N zones see the date jump back
 * a day when re-rendering a picker. ISO timestamps with time/timezone are
 * passed through to the native Date constructor (which handles them).
 */
export function parseDateLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}
