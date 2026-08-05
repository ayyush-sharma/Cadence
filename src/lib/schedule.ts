import { CATEGORIES, DEFAULT_CATEGORY_ID, REWARDS } from "@/lib/constants";
import { fromDateKey, toDateKey, todayKey, weekdayOf } from "@/lib/time";
import type {
  Block,
  CategoryId,
  CategoryStat,
  DailyPoint,
  DateKey,
  DayBlock,
  DayRecord,
  PeriodStats,
  ScheduledSnapshot,
  StreakSummary,
} from "@/lib/types";
import { format } from "date-fns";

/**
 * Pure scheduling and statistics logic.
 *
 * Deliberately free of React and Firebase so it can be reasoned about — and
 * unit tested — on its own.
 */

/* -------------------------------------------------------------------------- */
/* Resolving a day                                                            */
/* -------------------------------------------------------------------------- */

/** Template blocks that recur on the given date, sorted by start time. */
export function blocksForDate(blocks: Block[], date: DateKey): Block[] {
  const weekday = weekdayOf(date);
  return blocks
    .filter((block) => !block.archived && block.days.includes(weekday))
    .sort(sortByStart);
}

export function toSnapshot(block: Block): ScheduledSnapshot {
  return {
    blockId: block.id,
    title: block.title,
    category: block.category,
    startMinutes: block.startMinutes,
    endMinutes: block.endMinutes,
  };
}

/**
 * Resolve what a given day looks like, merging the live template with any
 * stored history.
 *
 * Past days are authoritative from their stored snapshot: editing the weekly
 * template must never rewrite what yesterday's plan was. Today and future days
 * follow the live template, so edits show up immediately.
 *
 * A block completed earlier and later removed from the template still appears,
 * flagged `orphaned`, so history stays honest and totals keep adding up.
 */
export function resolveDayBlocks(
  blocks: Block[],
  record: DayRecord | undefined,
  date: DateKey,
  today: DateKey = todayKey(),
): DayBlock[] {
  const isPast = date < today;
  const completed = new Set(record?.completed ?? []);

  const base: ScheduledSnapshot[] =
    isPast && record?.scheduled?.length
      ? record.scheduled
      : blocksForDate(blocks, date).map(toSnapshot);

  const seen = new Set(base.map((snapshot) => snapshot.blockId));

  const resolved: DayBlock[] = base.map((snapshot) => ({
    ...snapshot,
    completed: completed.has(snapshot.blockId),
    orphaned: false,
  }));

  // Re-attach completed blocks that are no longer part of the plan.
  for (const snapshot of record?.scheduled ?? []) {
    if (seen.has(snapshot.blockId)) continue;
    if (!completed.has(snapshot.blockId)) continue;
    resolved.push({ ...snapshot, completed: true, orphaned: true });
    seen.add(snapshot.blockId);
  }

  return resolved.sort(sortByStart);
}

function sortByStart(
  a: { startMinutes: number; endMinutes: number },
  b: { startMinutes: number; endMinutes: number },
): number {
  return a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes;
}

/* -------------------------------------------------------------------------- */
/* Overlap layout                                                             */
/* -------------------------------------------------------------------------- */

export interface LaidOutBlock<T> {
  block: T;
  /** Horizontal lane among overlapping blocks. */
  column: number;
  /** Total lanes in this block's overlap cluster. */
  columns: number;
}

/**
 * Assign side-by-side columns to overlapping blocks, calendar-style.
 *
 * Blocks are grouped into clusters of mutual overlap; within a cluster each
 * block takes the first free lane. Width is then `1 / columns`.
 */
export function layoutOverlaps<
  T extends { startMinutes: number; endMinutes: number },
>(items: T[]): LaidOutBlock<T>[] {
  const sorted = [...items].sort(sortByStart);
  const result: LaidOutBlock<T>[] = [];

  let cluster: T[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;

    // Lane assignment: reuse a lane once its last block has ended.
    const laneEnds: number[] = [];
    const assigned = cluster.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.startMinutes);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[lane] = item.endMinutes;
      }
      return { block: item, column: lane };
    });

    const columns = laneEnds.length;
    for (const entry of assigned) result.push({ ...entry, columns });

    cluster = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.startMinutes >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMinutes);
  }
  flush();

  return result;
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export function dayCompletionRate(dayBlocks: DayBlock[]): number {
  if (dayBlocks.length === 0) return 0;
  const done = dayBlocks.filter((block) => block.completed).length;
  return done / dayBlocks.length;
}

/** A day counts toward the streak only if it had blocks and cleared the bar. */
export function qualifiesForStreak(dayBlocks: DayBlock[]): boolean {
  if (dayBlocks.length === 0) return false;
  return dayCompletionRate(dayBlocks) >= REWARDS.streakThreshold;
}

/** Aggregate stats across an ordered list of dates. */
export function computeStats(
  dates: DateKey[],
  blocks: Block[],
  records: Map<DateKey, DayRecord>,
  today: DateKey = todayKey(),
): PeriodStats {
  const perCategory = new Map<CategoryId, CategoryStat>();
  let totalBlocks = 0;
  let completedBlocks = 0;
  let focusedMinutes = 0;
  let daysActive = 0;

  for (const date of dates) {
    const dayBlocks = resolveDayBlocks(blocks, records.get(date), date, today);
    if (dayBlocks.length === 0) continue;

    totalBlocks += dayBlocks.length;
    if (qualifiesForStreak(dayBlocks)) daysActive += 1;

    for (const block of dayBlocks) {
      const category = normaliseCategory(block.category);
      const stat = perCategory.get(category) ?? {
        category,
        scheduled: 0,
        completed: 0,
        minutes: 0,
      };
      stat.scheduled += 1;

      if (block.completed) {
        const minutes = Math.max(0, block.endMinutes - block.startMinutes);
        completedBlocks += 1;
        focusedMinutes += minutes;
        stat.completed += 1;
        stat.minutes += minutes;
      }

      perCategory.set(category, stat);
    }
  }

  return {
    totalBlocks,
    completedBlocks,
    completionRate: totalBlocks === 0 ? 0 : completedBlocks / totalBlocks,
    focusedMinutes,
    daysActive,
    perCategory: [...perCategory.values()].sort(
      (a, b) => b.minutes - a.minutes,
    ),
  };
}

/** Per-day series for charts and the heatmap. */
export function buildDailySeries(
  dates: DateKey[],
  blocks: Block[],
  records: Map<DateKey, DayRecord>,
  today: DateKey = todayKey(),
): DailyPoint[] {
  return dates.map((date) => {
    const dayBlocks = resolveDayBlocks(blocks, records.get(date), date, today);
    const completed = dayBlocks.filter((block) => block.completed).length;
    return {
      date,
      label: format(fromDateKey(date), "d MMM"),
      total: dayBlocks.length,
      completed,
      rate: dayBlocks.length === 0 ? 0 : completed / dayBlocks.length,
    };
  });
}

/**
 * Current and longest streaks.
 *
 * `dates` must be ascending. Today is skipped rather than breaking the streak
 * when it hasn't qualified yet — a streak shouldn't die at 00:01 just because
 * the day hasn't happened. Future dates are ignored entirely.
 */
export function computeStreaks(
  dates: DateKey[],
  blocks: Block[],
  records: Map<DateKey, DayRecord>,
  today: DateKey = todayKey(),
): StreakSummary {
  const past = dates.filter((date) => date <= today);

  let longest = 0;
  let running = 0;
  let totalActiveDays = 0;

  const qualified = new Map<DateKey, boolean>();

  for (const date of past) {
    const dayBlocks = resolveDayBlocks(blocks, records.get(date), date, today);
    const ok = qualifiesForStreak(dayBlocks);
    qualified.set(date, ok);

    if (ok) {
      running += 1;
      totalActiveDays += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  // Walk backwards from today for the active streak.
  let current = 0;
  for (let i = past.length - 1; i >= 0; i -= 1) {
    const date = past[i];
    const ok = qualified.get(date) ?? false;

    if (ok) {
      current += 1;
      continue;
    }
    // Grace period: an unfinished today doesn't end the streak.
    if (date === today) continue;
    break;
  }

  return { current, longest, totalActiveDays };
}

/** Inclusive list of `yyyy-MM-dd` keys between two dates. */
export function dateRange(start: Date, end: Date): DateKey[] {
  const keys: DateKey[] = [];
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= last) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));

/** Guards against unknown ids from older documents or hand-edited data. */
export function normaliseCategory(value: string): CategoryId {
  return CATEGORY_IDS.has(value)
    ? (value as CategoryId)
    : (DEFAULT_CATEGORY_ID as CategoryId);
}

export function categoryMeta(id: string) {
  const normalised = normaliseCategory(id);
  const found = CATEGORIES.find((category) => category.id === normalised);
  // `normaliseCategory` guarantees a hit; the fallback satisfies the type.
  return found ?? CATEGORIES[0];
}

/** Milestone reached at exactly this streak length, if any. */
export function milestoneFor(streak: number): number | null {
  return REWARDS.milestones.includes(streak as never) ? streak : null;
}

/** Deterministic-free random pick used for rotating congratulation lines. */
export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
