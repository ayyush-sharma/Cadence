import { TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A single headline number.
 *
 * A stat tile — not a one-bar chart — is the right form for one current value
 * plus an optional change indicator.
 */
export function StatTile({
  label,
  value,
  hint,
  delta,
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Change vs the previous period, as a ratio (0.12 = +12 points). */
  delta?: number | null;
  Icon?: ComponentType<{ className?: string }>;
}) {
  // A delta of exactly zero is "no change", not an improvement.
  const direction =
    delta == null || delta === 0 ? null : delta > 0 ? "up" : "down";

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon ? <Icon className="size-3.5" /> : null}
          {label}
        </div>

        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

        <div className="mt-1 flex items-center gap-2">
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}

          {direction ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                direction === "up" ? "text-success" : "text-muted-foreground",
              )}
            >
              {direction === "up" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {Math.abs(Math.round((delta ?? 0) * 100))} pts
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
