"use client";

import { Plus } from "lucide-react";
import { Fragment, useMemo } from "react";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOUR_HEIGHT_PX,
  WEEKDAYS,
  WEEKDAY_ORDER,
} from "@/lib/constants";
import { categoryMeta, layoutOverlaps } from "@/lib/schedule";
import { formatMinutes, gridHours } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Block, WeekdayIndex } from "@/lib/types";

/**
 * Calendar-style view of the weekly template.
 *
 * Blocks are absolutely positioned inside each day column, offset by their
 * start time. Overlapping blocks share the column width via `layoutOverlaps`,
 * the same way a calendar app splits concurrent events.
 *
 * Blocks outside the visible hour range are clamped to the grid edges so they
 * stay reachable instead of rendering off-canvas.
 */
export function WeekGrid({
  blocks,
  onSelectBlock,
  onAddToDay,
}: {
  blocks: Block[];
  onSelectBlock: (block: Block) => void;
  onAddToDay: (day: WeekdayIndex) => void;
}) {
  const hours = useMemo(() => gridHours(), []);
  const gridStartMinutes = GRID_START_HOUR * 60;
  const gridEndMinutes = GRID_END_HOUR * 60;
  const totalHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX;

  const byDay = useMemo(() => {
    const map = new Map<WeekdayIndex, Block[]>();
    for (const day of WEEKDAY_ORDER) {
      map.set(
        day as WeekdayIndex,
        blocks.filter((block) => block.days.includes(day as WeekdayIndex)),
      );
    }
    return map;
  }, [blocks]);

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-surface">
      {/* Fixed min-width keeps columns readable; the container scrolls on phones. */}
      <div className="min-w-[46rem]">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border">
          <div aria-hidden />
          {WEEKDAY_ORDER.map((day) => (
            <div
              key={day}
              className="border-l border-border px-2 py-2.5 text-center text-xs font-medium text-muted-foreground"
            >
              {WEEKDAYS[day].short}
            </div>
          ))}
        </div>

        <div
          className="relative grid grid-cols-[3.5rem_repeat(7,1fr)]"
          style={{ height: totalHeight }}
        >
          {/* Hour gutter */}
          <div className="relative">
            {hours.slice(0, -1).map((hour, index) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-subtle-foreground"
                style={{ top: index * HOUR_HEIGHT_PX }}
              >
                {formatMinutes(hour * 60)}
              </div>
            ))}
          </div>

          {WEEKDAY_ORDER.map((day) => {
            const dayBlocks = byDay.get(day as WeekdayIndex) ?? [];
            const laidOut = layoutOverlaps(dayBlocks);

            return (
              <div key={day} className="group relative border-l border-border">
                {/* Hour rules */}
                {hours.slice(0, -1).map((hour, index) => (
                  <Fragment key={hour}>
                    <div
                      className="absolute inset-x-0 border-t border-border/60"
                      style={{ top: index * HOUR_HEIGHT_PX }}
                    />
                  </Fragment>
                ))}

                {/* Quick-add affordance, revealed on hover of the column. */}
                <button
                  type="button"
                  onClick={() => onAddToDay(day as WeekdayIndex)}
                  aria-label={`Add a block on ${WEEKDAYS[day].label}`}
                  className="absolute inset-x-1 bottom-1 z-10 hidden items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none group-hover:flex"
                >
                  <Plus className="size-3" />
                  Add
                </button>

                {laidOut.map(({ block, column, columns }) => {
                  // Clamp to the visible window so long or unusual blocks stay
                  // on screen rather than overflowing the grid.
                  const top =
                    ((Math.max(block.startMinutes, gridStartMinutes) -
                      gridStartMinutes) /
                      60) *
                    HOUR_HEIGHT_PX;
                  const height =
                    ((Math.min(block.endMinutes, gridEndMinutes) -
                      Math.max(block.startMinutes, gridStartMinutes)) /
                      60) *
                    HOUR_HEIGHT_PX;

                  if (height <= 0) return null;

                  const meta = categoryMeta(block.category);
                  const widthPct = 100 / columns;
                  const isTight = height < 34;

                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => onSelectBlock(block)}
                      title={`${block.title} · ${formatMinutes(block.startMinutes)}–${formatMinutes(block.endMinutes)}`}
                      className={cn(
                        "absolute overflow-hidden rounded-md border-l-2 px-1.5 text-left transition-all hover:z-20 hover:shadow-soft focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        isTight ? "py-0" : "py-1",
                      )}
                      style={
                        {
                          top,
                          height: Math.max(height - 2, 16),
                          left: `calc(${column * widthPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          "--block-color-light": meta.light,
                          "--block-color-dark": meta.dark,
                          borderLeftColor: "var(--block-color)",
                          // `color-mix` tints the surface with the category hue
                          // without needing a second colour token per category.
                          backgroundColor:
                            "color-mix(in oklab, var(--block-color) 14%, var(--surface))",
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className={cn(
                          "block truncate font-medium leading-tight",
                          isTight ? "text-[10px]" : "text-[11px]",
                        )}
                      >
                        {block.title}
                      </span>
                      {!isTight ? (
                        <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                          {formatMinutes(block.startMinutes)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
