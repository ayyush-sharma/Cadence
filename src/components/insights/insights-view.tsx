"use client";

import { format } from "date-fns";
import { CalendarCheck, Clock, Flame, Target } from "lucide-react";
import { CategoryBreakdown } from "@/components/insights/category-breakdown";
import { CompletionChart } from "@/components/insights/completion-chart";
import { Heatmap } from "@/components/insights/heatmap";
import { StatTile } from "@/components/insights/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton, Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { useBlocks } from "@/hooks/use-blocks";
import { useInsights, type InsightRange } from "@/hooks/use-insights";
import { formatDuration } from "@/lib/time";

/** Weekly and monthly summary dashboard. */
export function InsightsView() {
  const { blocks, loading: blocksLoading } = useBlocks();
  const {
    range,
    setRange,
    loading,
    stats,
    completionDelta,
    series,
    heatmap,
    streaks,
    periodStart,
    periodEnd,
  } = useInsights(blocks);

  const busy = loading || blocksLoading;

  const periodLabel =
    range === "week"
      ? `${format(periodStart, "d MMM")} – ${format(periodEnd, "d MMM")}`
      : format(periodStart, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{periodLabel}</p>
        </div>

        <Tabs
          value={range}
          onValueChange={(value) => setRange(value as InsightRange)}
        >
          <TabsList>
            <TabsTrigger value="week">This week</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {busy ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Completion"
              value={`${Math.round(stats.completionRate * 100)}%`}
              hint={`${stats.completedBlocks}/${stats.totalBlocks} blocks`}
              delta={completionDelta}
              Icon={Target}
            />
            <StatTile
              label="Time focused"
              value={formatDuration(stats.focusedMinutes)}
              hint="on completed blocks"
              Icon={Clock}
            />
            <StatTile
              label="Current streak"
              value={`${streaks.current}`}
              hint={streaks.current === 1 ? "day" : "days"}
              Icon={Flame}
            />
            <StatTile
              label="Best streak"
              value={`${streaks.longest}`}
              hint={`${streaks.totalActiveDays} active days total`}
              Icon={CalendarCheck}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily completion</CardTitle>
              <CardDescription>
                Share of each day&apos;s blocks you ticked off.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletionChart data={series} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Where your time went</CardTitle>
                <CardDescription>
                  Completed time by category this {range}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown stats={stats.perCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consistency</CardTitle>
                <CardDescription>
                  The last six months at a glance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Heatmap data={heatmap} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
