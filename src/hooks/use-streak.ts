"use client";

import { useEffect, useState } from "react";
import { subDays } from "date-fns";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchDaysInRange } from "@/lib/db";
import { computeStreaks, dateRange } from "@/lib/schedule";
import { toDateKey, todayKey } from "@/lib/time";
import type { Block, StreakSummary } from "@/lib/types";

const EMPTY: StreakSummary = { current: 0, longest: 0, totalActiveDays: 0 };

/** How far back to look when computing the active streak. */
const LOOKBACK_DAYS = 120;

/**
 * Current streak for the header chip.
 *
 * A one-shot read rather than a live subscription: the streak only changes when
 * a day tips over the completion threshold, so it is recomputed when `blocks`
 * or the date changes rather than on every write.
 */
export function useStreak(blocks: Block[]): {
  streak: StreakSummary;
  loading: boolean;
} {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const today = todayKey();
  const key = uid ? `${uid}:${today}` : null;

  // Tagged with the key it was computed for, so `loading` is derived rather
  // than toggled inside the effect.
  const [state, setState] = useState<{
    forKey: string | null;
    streak: StreakSummary;
  }>({ forKey: null, streak: EMPTY });

  useEffect(() => {
    if (!uid || !key) return;

    let cancelled = false;

    void (async () => {
      try {
        const start = subDays(new Date(), LOOKBACK_DAYS);
        const records = await fetchDaysInRange(uid, toDateKey(start), today);
        const dates = dateRange(start, new Date());
        const summary = computeStreaks(dates, blocks, records, today);
        if (!cancelled) setState({ forKey: key, streak: summary });
      } catch {
        // The streak is a motivational garnish; a failed read should never
        // surface an error over the day's actual content.
        if (!cancelled) setState({ forKey: key, streak: EMPTY });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, key, blocks, today]);

  const settled = state.forKey === key;

  return {
    streak: settled ? state.streak : EMPTY,
    loading: uid !== null && !settled,
  };
}
