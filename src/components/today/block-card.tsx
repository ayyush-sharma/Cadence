"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/misc";
import { categoryMeta } from "@/lib/schedule";
import { formatDuration, formatRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { DayBlock } from "@/lib/types";

interface BlockCardProps {
  block: DayBlock;
  /** True while the block's write is in flight. */
  pending: boolean;
  /** True when this block's time window contains the current moment. */
  isNow: boolean;
  /** Passes the tick's screen position so confetti erupts from the checkbox. */
  onToggle: (blockId: string, origin?: { x: number; y: number }) => void;
  disabled?: boolean;
}

/**
 * A single scheduled block for a day.
 *
 * The whole card is the hit target — on a phone, aiming at a small checkbox is
 * the difference between a satisfying tick and a fiddly one.
 */
export function BlockCard({
  block,
  pending,
  isNow,
  onToggle,
  disabled = false,
}: BlockCardProps) {
  const meta = categoryMeta(block.category);
  const checkboxRef = useRef<HTMLSpanElement>(null);
  const duration = block.endMinutes - block.startMinutes;

  const handleToggle = () => {
    if (disabled) return;

    // Confetti origin is expressed in viewport ratios.
    const rect = checkboxRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : undefined;

    onToggle(block.blockId, origin);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      // Both theme variants are published as custom properties; `globals.css`
      // picks which one `--block-color` resolves to. `light-dark()` would not
      // work here because the theme is driven by a `.dark` class, not by
      // `color-scheme`.
      style={
        {
          "--block-color-light": meta.light,
          "--block-color-dark": meta.dark,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-pressed={block.completed}
        aria-label={`${block.title}, ${formatRange(block.startMinutes, block.endMinutes)}${
          block.completed ? ", completed" : ""
        }`}
        className={cn(
          "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-surface p-3.5 text-left transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          block.completed
            ? "border-border/70 bg-surface-muted"
            : "border-border hover:border-border-strong hover:shadow-soft",
          isNow && !block.completed && "border-accent/45 shadow-soft",
          disabled ? "cursor-default" : "active:scale-[0.995]",
        )}
      >
        {/* Category stripe down the leading edge. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1 transition-opacity",
            block.completed ? "opacity-30" : "opacity-100",
          )}
          style={{ backgroundColor: "var(--block-color)" }}
        />

        <span
          ref={checkboxRef}
          aria-hidden
          className={cn(
            "ml-1 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all duration-200",
            block.completed
              ? "border-success bg-success text-white"
              : "border-border-strong text-transparent group-hover:border-accent",
            pending && "opacity-70",
          )}
        >
          <motion.span
            initial={false}
            animate={
              block.completed
                ? { scale: 1, opacity: 1 }
                : { scale: 0.4, opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </motion.span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium transition-colors",
                block.completed && "text-muted-foreground line-through",
              )}
            >
              {block.title}
            </span>
            {isNow && !block.completed ? (
              <Badge tone="accent" className="shrink-0">
                Now
              </Badge>
            ) : null}
            {block.orphaned ? (
              <Badge className="shrink-0" title="No longer in your weekly plan">
                Removed
              </Badge>
            ) : null}
          </span>

          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRange(block.startMinutes, block.endMinutes)}</span>
            <span aria-hidden className="text-subtle-foreground">
              ·
            </span>
            <span>{formatDuration(duration)}</span>
            <span aria-hidden className="text-subtle-foreground">
              ·
            </span>
            <span style={{ color: "var(--block-color)" }}>{meta.label}</span>
          </span>
        </span>
      </button>
    </motion.div>
  );
}
