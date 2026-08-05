import confetti from "canvas-confetti";
import { REWARDS } from "@/lib/constants";

/**
 * The reward layer: confetti and haptics.
 *
 * Every function here is a no-op outside the browser and degrades silently
 * where the platform lacks support, so callers never need to guard.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Small burst anchored to the element that was just ticked off, so the reward
 * appears where the user is looking rather than in the middle of the screen.
 */
export function celebrateBlock(origin?: { x: number; y: number }) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  void confetti({
    ...REWARDS.blockConfetti,
    origin: origin ?? { x: 0.5, y: 0.6 },
    colors: confettiColors(),
    disableForReducedMotion: true,
  });
}

/** Larger two-sided burst for finishing every block in a day. */
export function celebrateDay() {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const colors = confettiColors();

  void confetti({
    ...REWARDS.dayConfetti,
    origin: { x: 0.2, y: 0.7 },
    angle: 60,
    colors,
    disableForReducedMotion: true,
  });
  void confetti({
    ...REWARDS.dayConfetti,
    origin: { x: 0.8, y: 0.7 },
    angle: 120,
    colors,
    disableForReducedMotion: true,
  });
}

/** Vibrate where supported; silently ignored on desktop and iOS Safari. */
export function haptic(pattern: readonly number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate([...pattern]);
  } catch {
    // Some browsers throw when the page is not user-activated. Not important.
  }
}

export function hapticComplete() {
  haptic(REWARDS.haptics.complete);
}

export function hapticDayComplete() {
  haptic(REWARDS.haptics.dayComplete);
}

/**
 * Read the live accent colours from CSS custom properties so confetti matches
 * whichever theme is active instead of hardcoding hex values.
 */
function confettiColors(): string[] {
  const fallback = ["#f0a13a", "#f6c453", "#8bd4a1", "#7aa5f0"];
  if (typeof window === "undefined") return fallback;

  const styles = getComputedStyle(document.documentElement);
  const picked = ["--accent", "--success", "--accent-hover"]
    .map((token) => styles.getPropertyValue(token).trim())
    .filter(Boolean);

  return picked.length > 0 ? picked : fallback;
}
