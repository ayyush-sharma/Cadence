"use client";

import { useChartColors } from "@/hooks/use-chart-colors";
import { categoryMeta } from "@/lib/schedule";
import { formatDuration } from "@/lib/time";
import type { CategoryStat } from "@/lib/types";

/**
 * Where the completed hours actually went.
 *
 * A labelled horizontal bar list rather than a pie: names sit beside their
 * bars, so identity never depends on matching a colour to a legend. That also
 * discharges the contrast warning on the lighter category hues, since every
 * value is readable as text.
 */
export function CategoryBreakdown({ stats }: { stats: CategoryStat[] }) {
  const colors = useChartColors();

  const withTime = stats.filter((stat) => stat.minutes > 0);

  if (withTime.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Complete a few blocks to see where your time goes.
      </p>
    );
  }

  const max = Math.max(...withTime.map((stat) => stat.minutes));

  return (
    <ul className="space-y-3">
      {withTime.map((stat) => {
        const meta = categoryMeta(stat.category);
        const pct = max === 0 ? 0 : (stat.minutes / max) * 100;

        return (
          <li key={stat.category}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-medium">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[stat.category] }}
                />
                {meta.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatDuration(stat.minutes)}
                <span className="ml-1.5 text-subtle-foreground">
                  {stat.completed}/{stat.scheduled}
                </span>
              </span>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: colors[stat.category],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
