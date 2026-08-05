"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Completion ratio, 0–1. */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Circular progress indicator for the day's completion.
 *
 * The arc is drawn with `strokeDasharray`/`strokeDashoffset` and animated by
 * Motion, so it sweeps forward as blocks are ticked off. It flips to the
 * success colour on a full day, which is the visual payoff for finishing.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  className,
  children,
}: ProgressRingProps) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isComplete = clamped >= 1;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped * 100)}% complete`}
    >
      {/* -90° rotation puts the arc's origin at 12 o'clock. */}
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-border"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          className={isComplete ? "stroke-success" : "stroke-accent"}
          style={{ strokeDasharray: circumference }}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
