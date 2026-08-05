"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Flame,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";
import { BlockCard } from "@/components/today/block-card";
import { DayNote } from "@/components/today/day-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, Skeleton } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useBlocks } from "@/hooks/use-blocks";
import { useDay } from "@/hooks/use-day";
import { useStreak } from "@/hooks/use-streak";
import { ROUTES } from "@/lib/constants";
import {
  formatDuration,
  friendlyDateLabel,
  fromDateKey,
  toDateKey,
  todayKey,
} from "@/lib/time";
import { currentMinutes } from "@/lib/time";
import type { DayBlock } from "@/lib/types";

/**
 * The daily driver: what's on today, what's done, and what's next.
 */
export function TodayView() {
  const { blocks, loading: blocksLoading } = useBlocks();
  const { streak } = useStreak(blocks);
  const [date, setDate] = useState(() => todayKey());

  const {
    record,
    dayBlocks,
    loading: dayLoading,
    pending,
    completedCount,
    totalCount,
    completionRate,
    isComplete,
    toggleBlock,
    saveNote,
  } = useDay(date, blocks);

  const isToday = date === todayKey();
  const loading = blocksLoading || dayLoading;

  // Re-render each minute so the "Now" badge and next-up hint stay accurate
  // without a timer per block.
  const [now, setNow] = useState(() => currentMinutes());
  useEffect(() => {
    const id = setInterval(() => setNow(currentMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const shift = (days: number) =>
    setDate(toDateKey(addDays(fromDateKey(date), days)));

  const remainingMinutes = useMemo(
    () =>
      dayBlocks
        .filter((block) => !block.completed)
        .reduce(
          (sum, block) => sum + (block.endMinutes - block.startMinutes),
          0,
        ),
    [dayBlocks],
  );

  const nextUp = useMemo(
    () =>
      isToday
        ? dayBlocks.find((block) => !block.completed && block.endMinutes > now)
        : undefined,
    [dayBlocks, now, isToday],
  );

  const isNowBlock = (block: DayBlock) =>
    isToday && block.startMinutes <= now && now < block.endMinutes;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {friendlyDateLabel(date)}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading
              ? "Loading your day…"
              : totalCount === 0
                ? "Nothing scheduled."
                : `${completedCount} of ${totalCount} done · ${formatDuration(remainingMinutes)} left`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shift(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </Button>
          {!isToday ? (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setDate(todayKey())}
            >
              Today
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shift(1)}
            aria-label="Next day"
          >
            <ChevronRight />
          </Button>
        </div>
      </header>

      {loading ? (
        <LoadingState />
      ) : totalCount === 0 ? (
        <EmptyState hasAnyBlocks={blocks.length > 0} />
      ) : (
        <>
          <SummaryCard
            completionRate={completionRate}
            completedCount={completedCount}
            totalCount={totalCount}
            isComplete={isComplete}
            nextUpTitle={nextUp?.title}
            streak={streak.current}
          />

          <section className="space-y-2.5">
            <AnimatePresence initial={false}>
              {dayBlocks.map((block) => (
                <BlockCard
                  key={block.blockId}
                  block={block}
                  pending={pending.has(block.blockId)}
                  isNow={isNowBlock(block)}
                  onToggle={toggleBlock}
                />
              ))}
            </AnimatePresence>
          </section>

          <DayNote initialNote={record?.note ?? ""} onSave={saveNote} />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  completionRate,
  completedCount,
  totalCount,
  isComplete,
  nextUpTitle,
  streak,
}: {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  nextUpTitle?: string;
  streak: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-5 pt-5">
        <ProgressRing value={completionRate} size={88} strokeWidth={7}>
          <span className="text-lg font-semibold">
            {Math.round(completionRate * 100)}
            <span className="text-xs text-muted-foreground">%</span>
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <PartyPopper className="size-4" />
                  Day complete
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every block ticked off. That&apos;s the whole plan.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <p className="text-sm font-medium">
                  {completedCount === 0
                    ? "Let's get the first one done."
                    : `${totalCount - completedCount} to go.`}
                </p>
                {nextUpTitle ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    Next up · {nextUpTitle}
                  </p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          <StreakChip streak={streak} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Current streak, hidden until there is one worth showing. */
function StreakChip({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <Badge tone="accent" className="mt-3">
      <Flame className="size-3" />
      {streak} day streak
    </Badge>
  );
}

function EmptyState({ hasAnyBlocks }: { hasAnyBlocks: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-14 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <CalendarPlus className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium">
          {hasAnyBlocks
            ? "Nothing scheduled for this day"
            : "Your week is empty"}
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {hasAnyBlocks
            ? "Add a block to this weekday in your schedule."
            : "Build your weekly rhythm once, and every day fills itself in."}
        </p>
        <Button asChild className="mt-5" size="sm">
          <Link href={ROUTES.schedule}>
            <CalendarPlus />
            Open schedule
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-[4.5rem] w-full rounded-xl" />
      ))}
    </div>
  );
}
