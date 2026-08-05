"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/misc";
import { WEEKDAYS, WEEK_STARTS_ON } from "@/lib/constants";
import { fromDateKey } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";

/**
 * Consistency over the last few months, in the style of a contribution graph.
 *
 * Magnitude, so the fill is a single sequential hue — more complete is more
 * opaque. Empty days use the surface colour, keeping "nothing planned"
 * visually distinct from "planned and missed".
 */
export function Heatmap({ data }: { data: DailyPoint[] }) {
  // Group into week columns so the grid reads left-to-right by week.
  const weeks = useMemo(() => {
    const columns: (DailyPoint | null)[][] = [];
    let current: (DailyPoint | null)[] = [];

    for (const point of data) {
      const weekday = fromDateKey(point.date).getDay();
      // Position within a Monday-first column.
      const slot = (weekday - WEEK_STARTS_ON + 7) % 7;

      if (current.length === 0 && slot > 0) {
        current = Array.from({ length: slot }, () => null);
      }

      current.push(point);

      if (slot === 6) {
        columns.push(current);
        current = [];
      }
    }

    if (current.length > 0) {
      while (current.length < 7) current.push(null);
      columns.push(current);
    }

    return columns;
  }, [data]);

  return (
    <div className="space-y-2">
      <div className="scrollbar-thin overflow-x-auto pb-1">
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((point, dayIndex) => (
                <Cell key={dayIndex} point={point} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <span
            key={level}
            aria-hidden
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: fillFor(level) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function Cell({ point }: { point: DailyPoint | null }) {
  if (!point) {
    return <span aria-hidden className="size-3 rounded-[3px]" />;
  }

  const weekday = WEEKDAYS[fromDateKey(point.date).getDay()].label;
  const label =
    point.total === 0
      ? `${weekday} ${format(fromDateKey(point.date), "d MMM")} · nothing scheduled`
      : `${weekday} ${format(fromDateKey(point.date), "d MMM")} · ${point.completed}/${point.total} done`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={label}
          className="size-3 rounded-[3px] transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          style={{
            backgroundColor:
              point.total === 0 ? "var(--surface-muted)" : fillFor(point.rate),
          }}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Sequential accent ramp.
 *
 * Opacity is stepped rather than continuous so adjacent levels stay visually
 * distinct; a smooth gradient makes 60% and 70% indistinguishable.
 */
function fillFor(rate: number): string {
  if (rate <= 0) return "var(--surface-muted)";
  if (rate < 0.35)
    return "color-mix(in oklab, var(--accent) 28%, var(--surface))";
  if (rate < 0.65)
    return "color-mix(in oklab, var(--accent) 52%, var(--surface))";
  if (rate < 1) return "color-mix(in oklab, var(--accent) 76%, var(--surface))";
  return "var(--accent)";
}
