"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { INSIGHTS, WEEK_STARTS_ON } from "@/lib/constants";
import { fetchDaysInRange } from "@/lib/db";
import { friendlyDataError } from "@/lib/errors";
import {
  buildDailySeries,
  computeStats,
  computeStreaks,
  dateRange,
} from "@/lib/schedule";
import { toDateKey, todayKey } from "@/lib/time";
import type { Block, DateKey, DayRecord } from "@/lib/types";

export type InsightRange = "week" | "month";

/**
 * Historical data for the insights dashboard.
 *
 * One range query covers the widest window any panel needs (the heatmap), and
 * every narrower period is derived from that same in-memory map. This keeps
 * switching between week and month instant and costs a single read burst
 * rather than one per view.
 */
export function useInsights(blocks: Block[]) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [range, setRange] = useState<InsightRange>("week");

  const today = todayKey();
  const key = uid ? `${uid}:${today}` : null;

  // Widest window we ever need, anchored to the heatmap.
  const windowStart = useMemo(
    () =>
      startOfWeek(subDays(new Date(), INSIGHTS.heatmapWeeks * 7), {
        weekStartsOn: WEEK_STARTS_ON,
      }),
    [],
  );

  // Tagged with the key it was fetched for so `loading` is derived, not
  // toggled inside the effect.
  const [state, setState] = useState<{
    forKey: string | null;
    records: Map<DateKey, DayRecord>;
  }>({ forKey: null, records: new Map() });

  // Bumping this re-runs the fetch effect; it is how `refresh()` works without
  // duplicating the request logic outside the effect.
  const [reloadToken, setReloadToken] = useState(0);
  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!uid || !key) return;

    let cancelled = false;

    void (async () => {
      try {
        const fetched = await fetchDaysInRange(
          uid,
          toDateKey(windowStart),
          today,
        );
        if (!cancelled) setState({ forKey: key, records: fetched });
      } catch (fetchError) {
        if (cancelled) return;
        toast.error(friendlyDataError(fetchError));
        // Settle anyway so the dashboard renders its empty state rather than
        // spinning forever.
        setState({ forKey: key, records: new Map() });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, key, windowStart, today, reloadToken]);

  const settled = state.forKey === key;
  const records = useMemo(
    () => (settled ? state.records : new Map<DateKey, DayRecord>()),
    [settled, state.records],
  );
  const loading = uid !== null && !settled;

  /* ---------------------------------------------------------------------- */
  /* Derived periods                                                        */
  /* ---------------------------------------------------------------------- */

  const now = useMemo(() => new Date(), []);

  const currentPeriod = useMemo(() => {
    const start =
      range === "week"
        ? startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON })
        : startOfMonth(now);
    const end =
      range === "week"
        ? endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON })
        : endOfMonth(now);
    return { start, end, dates: dateRange(start, end) };
  }, [range, now]);

  /** Same-length period immediately before, for the trend comparison. */
  const previousPeriod = useMemo(() => {
    const start =
      range === "week"
        ? startOfWeek(subDays(currentPeriod.start, 1), {
            weekStartsOn: WEEK_STARTS_ON,
          })
        : startOfMonth(subDays(currentPeriod.start, 1));
    const end =
      range === "week"
        ? endOfWeek(subDays(currentPeriod.start, 1), {
            weekStartsOn: WEEK_STARTS_ON,
          })
        : endOfMonth(subDays(currentPeriod.start, 1));
    return { start, end, dates: dateRange(start, end) };
  }, [range, currentPeriod.start]);

  const stats = useMemo(
    () => computeStats(currentPeriod.dates, blocks, records, today),
    [currentPeriod.dates, blocks, records, today],
  );

  const previousStats = useMemo(
    () => computeStats(previousPeriod.dates, blocks, records, today),
    [previousPeriod.dates, blocks, records, today],
  );

  const series = useMemo(
    () => buildDailySeries(currentPeriod.dates, blocks, records, today),
    [currentPeriod.dates, blocks, records, today],
  );

  const heatmapDates = useMemo(
    () => dateRange(windowStart, new Date()),
    [windowStart],
  );

  const heatmap = useMemo(
    () => buildDailySeries(heatmapDates, blocks, records, today),
    [heatmapDates, blocks, records, today],
  );

  const streaks = useMemo(
    () => computeStreaks(heatmapDates, blocks, records, today),
    [heatmapDates, blocks, records, today],
  );

  /** Percentage-point change in completion rate vs the previous period. */
  const completionDelta = useMemo(() => {
    if (previousStats.totalBlocks === 0) return null;
    return stats.completionRate - previousStats.completionRate;
  }, [stats.completionRate, previousStats]);

  return {
    range,
    setRange,
    loading,
    stats,
    previousStats,
    completionDelta,
    series,
    heatmap,
    streaks,
    periodStart: currentPeriod.start,
    periodEnd: currentPeriod.end,
    refresh,
  };
}
