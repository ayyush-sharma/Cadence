"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/hooks/use-chart-colors";
import type { DailyPoint } from "@/lib/types";

/**
 * Daily completion across the selected period.
 *
 * One measure on one axis. Bars carry a single sequential hue rather than
 * categorical colours — the job here is magnitude, not identity — and days
 * with nothing scheduled are drawn in the recessive grid colour so an empty
 * day reads differently from a failed one.
 */
export function CompletionChart({ data }: { data: DailyPoint[] }) {
  const theme = useChartTheme();

  const hasAnything = data.some((point) => point.total > 0);
  if (!hasAnything) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nothing scheduled in this period yet.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: -24 }}
        >
          <CartesianGrid
            stroke={theme.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: theme.axis }}
            tickLine={false}
            axisLine={false}
            // Keep labels readable on a month view without rotating them.
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.5, 1]}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
            tick={{ fontSize: 11, fill: theme.axis }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: theme.grid, opacity: 0.4 }}
            content={<CompletionTooltip />}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((point) => (
              <Cell
                key={point.date}
                fill={point.total === 0 ? theme.grid : theme.accent}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayload {
  payload: DailyPoint;
}

function CompletionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs shadow-lift">
      <p className="font-medium">{point.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        {point.total === 0
          ? "Nothing scheduled"
          : `${point.completed} of ${point.total} done · ${Math.round(point.rate * 100)}%`}
      </p>
    </div>
  );
}
