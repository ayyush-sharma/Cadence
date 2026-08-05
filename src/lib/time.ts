import { format, parse } from "date-fns";
import {
  DATE_KEY_FORMAT,
  GRID_END_HOUR,
  GRID_START_HOUR,
  MINUTES_IN_DAY,
  TIME_STEP_MINUTES,
} from "@/lib/constants";
import type { DateKey, WeekdayIndex } from "@/lib/types";

/**
 * Time helpers.
 *
 * Cadence stores times as minutes-from-local-midnight and dates as local
 * `yyyy-MM-dd` keys. Both choices avoid timezone drift: a 09:00 block should
 * read 09:00 wherever the user is, and `new Date().toISOString()` would
 * silently shift the date for anyone west of UTC late in the evening.
 */

/** Local date -> `yyyy-MM-dd`. Never use `toISOString()` for this. */
export function toDateKey(date: Date): DateKey {
  return format(date, DATE_KEY_FORMAT);
}

/** `yyyy-MM-dd` -> local `Date` at midnight. */
export function fromDateKey(key: DateKey): Date {
  return parse(key, DATE_KEY_FORMAT, new Date());
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function weekdayOf(key: DateKey): WeekdayIndex {
  return fromDateKey(key).getDay() as WeekdayIndex;
}

/** 540 -> "09:00" (24-hour, zero-padded). */
export function minutesToTime(minutes: number): string {
  const clamped = clampMinutes(minutes);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "09:00" -> 540. Returns `null` for malformed input. */
export function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** 540 -> "9:00 AM". Used wherever times are shown to the user. */
export function formatMinutes(minutes: number): string {
  const clamped = clampMinutes(minutes);
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRange(startMinutes: number, endMinutes: number): string {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}

/** "1h 30m", "45m", "2h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function clampMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 0;
  return Math.min(Math.max(Math.round(minutes), 0), MINUTES_IN_DAY);
}

/** Snap to the nearest `TIME_STEP_MINUTES` increment. */
export function snapMinutes(minutes: number): number {
  return clampMinutes(
    Math.round(minutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES,
  );
}

/** Every selectable time in a day, for time pickers. */
export function timeOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let m = 0; m < MINUTES_IN_DAY; m += TIME_STEP_MINUTES) {
    options.push({ value: m, label: formatMinutes(m) });
  }
  return options;
}

/** Hour labels for the timeline gutter. */
export function gridHours(): number[] {
  const hours: number[] = [];
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h += 1) hours.push(h);
  return hours;
}

/** Half-open overlap test — a block ending at 11:00 doesn't clash with 11:00. */
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Minutes since local midnight, for the "now" indicator. */
export function currentMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** "Today", "Yesterday", "Tomorrow", or e.g. "Mon, 4 Aug". */
export function friendlyDateLabel(
  key: DateKey,
  today: DateKey = todayKey(),
): string {
  if (key === today) return "Today";

  const target = fromDateKey(key);
  const base = fromDateKey(today);
  const diffDays = Math.round(
    (target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  return format(target, "EEE, d MMM");
}
