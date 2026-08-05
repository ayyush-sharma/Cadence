import type { CATEGORIES } from "@/lib/constants";

/** Category identifier, derived from the constants table so the two can't drift. */
export type CategoryId = (typeof CATEGORIES)[number]["id"];

/** Day of week, matching `Date.prototype.getDay()` (0 = Sunday). */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A date key in `yyyy-MM-dd` form, always in the user's local timezone. */
export type DateKey = string;

/**
 * A recurring block in the weekly template.
 *
 * Times are stored as minutes from local midnight rather than timestamps: a
 * block means "09:00 on my Monday", which should stay 09:00 if the user
 * travels. Absolute instants would drift across timezones.
 */
export interface Block {
  id: string;
  title: string;
  category: CategoryId;
  /** Days this block repeats on. */
  days: WeekdayIndex[];
  /** Minutes from midnight, e.g. 540 = 09:00. */
  startMinutes: number;
  /** Minutes from midnight; always greater than `startMinutes`. */
  endMinutes: number;
  notes?: string;
  /** Archived blocks stop generating new instances but keep their history. */
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Payload accepted when creating or editing a block via the form. */
export type BlockDraft = Omit<
  Block,
  "id" | "createdAt" | "updatedAt" | "archived"
> & { archived?: boolean };

/**
 * The record of what actually happened on a given date.
 *
 * A day document is created lazily — the first time the user opens or
 * interacts with that date — so untouched days cost nothing.
 */
export interface DayRecord {
  /** `yyyy-MM-dd`; also the Firestore document id. */
  date: DateKey;
  /** Block ids completed on this date. */
  completed: string[];
  /**
   * Snapshot of which blocks were scheduled that day.
   *
   * Denormalised on purpose: editing the weekly template must not rewrite
   * history, so past days keep the plan as it stood at the time.
   */
  scheduled: ScheduledSnapshot[];
  note?: string;
  updatedAt: number;
}

/** Immutable copy of a block as it existed on a particular day. */
export interface ScheduledSnapshot {
  blockId: string;
  title: string;
  category: CategoryId;
  startMinutes: number;
  endMinutes: number;
}

/** A block resolved for a specific date, with its completion state attached. */
export interface DayBlock extends ScheduledSnapshot {
  completed: boolean;
  /** True when the block exists only in history, not in the current template. */
  orphaned: boolean;
}

/** Aggregate completion stats for any date range. */
export interface PeriodStats {
  totalBlocks: number;
  completedBlocks: number;
  /** 0–1; `0` when nothing was scheduled. */
  completionRate: number;
  /** Planned minutes for completed blocks only. */
  focusedMinutes: number;
  /** Days meeting `REWARDS.streakThreshold`. */
  daysActive: number;
  perCategory: CategoryStat[];
}

export interface CategoryStat {
  category: CategoryId;
  scheduled: number;
  completed: number;
  minutes: number;
}

/** One point in the day-by-day trend series. */
export interface DailyPoint {
  date: DateKey;
  label: string;
  total: number;
  completed: number;
  rate: number;
}

export interface StreakSummary {
  /** Consecutive qualifying days ending today (or yesterday if today is unplayed). */
  current: number;
  longest: number;
  /** Total qualifying days on record. */
  totalActiveDays: number;
}

/** Serialisable auth user; avoids leaking the Firebase SDK type into the UI. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
