"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  COMPLETION_MESSAGES,
  DAY_COMPLETE_MESSAGES,
  UI,
} from "@/lib/constants";
import { setBlockCompletion, setDayNote, subscribeToDay } from "@/lib/db";
import { friendlyDataError } from "@/lib/errors";
import {
  celebrateBlock,
  celebrateDay,
  hapticComplete,
  hapticDayComplete,
} from "@/lib/rewards";
import { pickRandom, resolveDayBlocks, toSnapshot } from "@/lib/schedule";
import { blocksForDate } from "@/lib/schedule";
import { todayKey } from "@/lib/time";
import type { Block, DateKey, DayRecord } from "@/lib/types";

/**
 * Everything needed to render and interact with a single day.
 *
 * Owns the reward moment: it decides when to fire confetti and haptics, and
 * distinguishes finishing one block from finishing the entire day.
 */
export function useDay(date: DateKey, blocks: Block[]) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  /**
   * State tagged with the uid+date it belongs to.
   *
   * Deriving `loading` from that key (rather than toggling it at the top of the
   * effect) keeps the effect free of synchronous setState, and guarantees the
   * previous day's record is never shown while a new one loads.
   */
  const key = uid ? `${uid}:${date}` : null;
  const [state, setState] = useState<{
    forKey: string | null;
    record: DayRecord | undefined;
  }>({ forKey: null, record: undefined });

  // Ids currently mid-write, so the checkbox can show a settled state without
  // waiting for the Firestore round trip.
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!uid || !key) return;

    const unsubscribe = subscribeToDay(
      uid,
      date,
      (next) => setState({ forKey: key, record: next }),
      (subscriptionError) => {
        toast.error(friendlyDataError(subscriptionError));
        setState({ forKey: key, record: undefined });
      },
    );

    return unsubscribe;
  }, [uid, date, key]);

  const settled = state.forKey === key;
  const record = settled ? state.record : undefined;
  const loading = uid !== null && !settled;

  const dayBlocks = useMemo(
    () => resolveDayBlocks(blocks, record, date),
    [blocks, record, date],
  );

  const completedCount = dayBlocks.filter((block) => block.completed).length;
  const totalCount = dayBlocks.length;
  const completionRate = totalCount === 0 ? 0 : completedCount / totalCount;

  /**
   * The last date we fired the day-complete celebration for.
   *
   * Guards against re-celebrating when the same day re-renders or resyncs from
   * another device — only the transition into "all done" should fire, and only
   * once per day. Stored as the date itself rather than a boolean so switching
   * days resets it for free.
   */
  const celebratedDate = useRef<DateKey | null>(null);

  const toggleBlock = useCallback(
    async (blockId: string, origin?: { x: number; y: number }) => {
      if (!uid) return;

      const target = dayBlocks.find((block) => block.blockId === blockId);
      if (!target) return;

      const nextCompleted = !target.completed;

      // Snapshot the plan as it stands now so history survives later edits.
      const scheduled =
        record?.scheduled?.length && date < todayKey()
          ? record.scheduled
          : blocksForDate(blocks, date).map(toSnapshot);

      setPending((current) => new Set(current).add(blockId));

      // Celebrate immediately rather than after the write: the reward should
      // track the tap, not the network.
      if (nextCompleted) {
        const willCompleteDay =
          totalCount > 0 && completedCount + 1 === totalCount;

        if (willCompleteDay && celebratedDate.current !== date) {
          celebrateDay();
          hapticDayComplete();
          toast.success(pickRandom(DAY_COMPLETE_MESSAGES), {
            duration: UI.toastDuration,
          });
          celebratedDate.current = date;
        } else {
          celebrateBlock(origin);
          hapticComplete();
          toast.success(pickRandom(COMPLETION_MESSAGES), {
            duration: UI.toastDuration,
          });
        }
      } else if (celebratedDate.current === date) {
        // Un-ticking breaks the full day, so the next completion may celebrate
        // again.
        celebratedDate.current = null;
      }

      try {
        await setBlockCompletion(uid, date, blockId, nextCompleted, scheduled);
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(blockId);
          return next;
        });
      }
    },
    [uid, date, blocks, dayBlocks, record, completedCount, totalCount],
  );

  const saveNote = useCallback(
    async (note: string) => {
      if (!uid) return;
      try {
        await setDayNote(uid, date, note);
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      }
    },
    [uid, date],
  );

  return {
    record,
    dayBlocks,
    loading,
    pending,
    completedCount,
    totalCount,
    completionRate,
    isComplete: totalCount > 0 && completedCount === totalCount,
    toggleBlock,
    saveNote,
  };
}
