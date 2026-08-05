"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { CATEGORIES } from "@/lib/constants";
import type { CategoryId } from "@/lib/types";

/**
 * Category colours resolved for the active theme.
 *
 * Recharts needs concrete colour strings — it cannot consume a CSS variable
 * that changes with a class on `<html>`, which is how every other component
 * here picks up the theme.
 *
 * Derived during render rather than synced into state: `resolvedTheme` is
 * already reactive, so an effect would just add a second render pass. Before
 * hydration it is `undefined`, which correctly falls back to the light ramp.
 */
export function useChartColors(): Record<CategoryId, string> {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category.id,
          isDark ? category.dark : category.light,
        ]),
      ) as Record<CategoryId, string>,
    [isDark],
  );
}

/** Accent and neutral colours used by chart axes, grids and bars. */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return {
    isDark,
    accent: isDark ? "oklch(0.76 0.15 65)" : "oklch(0.72 0.155 62)",
    success: isDark ? "oklch(0.72 0.15 158)" : "oklch(0.63 0.14 155)",
    grid: isDark ? "oklch(0.28 0.01 70)" : "oklch(0.915 0.006 80)",
    axis: isDark ? "oklch(0.55 0.012 75)" : "oklch(0.66 0.012 75)",
    surface: isDark ? "oklch(0.235 0.01 70)" : "oklch(1 0 0)",
    border: isDark ? "oklch(0.35 0.012 70)" : "oklch(0.86 0.008 80)",
    text: isDark ? "oklch(0.94 0.006 85)" : "oklch(0.22 0.012 65)",
  };
}
