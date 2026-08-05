/**
 * Single source of truth for every tunable value in Cadence.
 *
 * Rule of thumb for contributors: if a string, number, colour or key is used
 * in more than one place — or a maintainer might reasonably want to change it
 * without reading component code — it belongs here, not inlined at the usage
 * site.
 */

/* -------------------------------------------------------------------------- */
/* App identity                                                               */
/* -------------------------------------------------------------------------- */

export const APP = {
  name: "Cadence",
  tagline: "Plan the week. Own the day.",
  description:
    "A calm, rewarding timetable tracker. Build a weekly rhythm, tick off your day, and watch the streak grow.",
  repository: "https://github.com/your-username/cadence",
} as const;

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export const ROUTES = {
  today: "/",
  schedule: "/schedule",
  insights: "/insights",
} as const;

export const NAV_ITEMS = [
  { href: ROUTES.today, label: "Today", icon: "CalendarCheck" },
  { href: ROUTES.schedule, label: "Schedule", icon: "CalendarRange" },
  { href: ROUTES.insights, label: "Insights", icon: "ChartNoAxesColumn" },
] as const;

/* -------------------------------------------------------------------------- */
/* Firestore                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Collection layout (all user-scoped, so security rules stay trivial):
 *
 *   users/{uid}
 *   users/{uid}/blocks/{blockId}        -> recurring weekly template blocks
 *   users/{uid}/days/{YYYY-MM-DD}       -> one materialised day per document
 */
export const COLLECTIONS = {
  users: "users",
  blocks: "blocks",
  days: "days",
} as const;

/* -------------------------------------------------------------------------- */
/* Time model                                                                 */
/* -------------------------------------------------------------------------- */

/** Minute granularity for every time picker and grid snap. */
export const TIME_STEP_MINUTES = 15;

export const MINUTES_IN_DAY = 24 * 60;

/** Vertical pixels per hour in the day timeline. */
export const HOUR_HEIGHT_PX = 64;

/** Day boundaries for the schedule grid, in hours (24h clock). */
export const GRID_START_HOUR = 5;
export const GRID_END_HOUR = 24;

/**
 * `date-fns` weekStartsOn: 0 = Sunday, 1 = Monday.
 * Cadence weeks run Monday to Sunday.
 */
export const WEEK_STARTS_ON = 1 as const;

/** Index matches JavaScript's `Date.prototype.getDay()`. */
export const WEEKDAYS = [
  { index: 0, key: "sun", short: "Sun", label: "Sunday" },
  { index: 1, key: "mon", short: "Mon", label: "Monday" },
  { index: 2, key: "tue", short: "Tue", label: "Tuesday" },
  { index: 3, key: "wed", short: "Wed", label: "Wednesday" },
  { index: 4, key: "thu", short: "Thu", label: "Thursday" },
  { index: 5, key: "fri", short: "Fri", label: "Friday" },
  { index: 6, key: "sat", short: "Sat", label: "Saturday" },
] as const;

/** Display order for the schedule editor (Monday-first). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DATE_KEY_FORMAT = "yyyy-MM-dd";

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Each category maps to a fixed hue used for block accents and charts.
 *
 * The two ramps are not a mechanical light/dark flip — they are separately
 * tuned, because the accessible lightness band differs per surface (L 0.43–0.77
 * on light, 0.48–0.67 on dark). Both sets are verified with the dataviz
 * palette validator and pass the lightness-band, chroma-floor, colour-blind
 * separation (protan/deutan/tritan), normal-vision, and contrast checks for
 * adjacent pairs.
 *
 * Two constraints to preserve when editing:
 *   1. Separation comes from spreading *lightness*, not just hue — red/green
 *      collapse under the common forms of colour blindness.
 *   2. Colour is never the only signal. Every chart and block also carries a
 *      text label, which is what makes six categories legible at all.
 *
 * Re-run the validator after any change to these values.
 */
export const CATEGORIES = [
  {
    id: "study",
    label: "Study",
    icon: "GraduationCap",
    light: "oklch(0.50 0.19 268)",
    dark: "oklch(0.56 0.19 268)",
  },
  {
    id: "work",
    label: "Work",
    icon: "Briefcase",
    light: "oklch(0.70 0.13 205)",
    dark: "oklch(0.66 0.13 205)",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "Dumbbell",
    light: "oklch(0.58 0.20 28)",
    dark: "oklch(0.60 0.19 28)",
  },
  {
    id: "personal",
    label: "Personal",
    icon: "Heart",
    light: "oklch(0.46 0.17 335)",
    dark: "oklch(0.53 0.19 335)",
  },
  {
    id: "learning",
    label: "Learning",
    icon: "BookOpen",
    light: "oklch(0.75 0.16 120)",
    dark: "oklch(0.66 0.15 120)",
  },
  {
    id: "rest",
    label: "Rest",
    icon: "Moon",
    light: "oklch(0.62 0.13 300)",
    dark: "oklch(0.60 0.15 300)",
  },
] as const;

export const DEFAULT_CATEGORY_ID = "study";

/* -------------------------------------------------------------------------- */
/* Reward + streak mechanics                                                  */
/* -------------------------------------------------------------------------- */

export const REWARDS = {
  /** Confetti burst fired when a single block is completed. */
  blockConfetti: {
    particleCount: 44,
    spread: 62,
    startVelocity: 26,
    gravity: 1.1,
    decay: 0.92,
    scalar: 0.85,
    ticks: 140,
  },
  /** Bigger celebration when every block for the day is done. */
  dayConfetti: {
    particleCount: 130,
    spread: 100,
    startVelocity: 42,
    gravity: 1,
    decay: 0.92,
    scalar: 1,
    ticks: 220,
  },
  /** Vibration patterns in milliseconds (no-op where unsupported). */
  haptics: {
    complete: [12],
    dayComplete: [16, 60, 28],
  },
  /** A day counts toward the streak at or above this completion ratio. */
  streakThreshold: 0.6,
  /** Streak lengths that earn a special toast. */
  milestones: [3, 7, 14, 30, 60, 100, 180, 365],
} as const;

/** Rotating congratulation lines, chosen at random on completion. */
export const COMPLETION_MESSAGES = [
  "Nice work.",
  "That's one down.",
  "Kept the promise.",
  "Momentum.",
  "Logged it.",
  "Consistency compounds.",
] as const;

export const DAY_COMPLETE_MESSAGES = [
  "Perfect day. Every block done.",
  "Clean sweep — the whole day is yours.",
  "That's a full day. Rest earned.",
] as const;

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export const INSIGHTS = {
  /** Weeks of history shown in the trend chart. */
  trendWeeks: 12,
  /** Weeks fetched to compute the heatmap. */
  heatmapWeeks: 26,
  /** Completion ratio buckets driving heatmap intensity. */
  heatmapSteps: [0, 0.25, 0.5, 0.75, 1] as const,
} as const;

/* -------------------------------------------------------------------------- */
/* UI timing                                                                  */
/* -------------------------------------------------------------------------- */

export const UI = {
  toastDuration: 2600,
  /** Matches the check-off animation so state settles after the visual. */
  completionAnimationMs: 420,
  /** Debounce for text inputs that write straight to Firestore. */
  inputDebounceMs: 500,
  maxBlockTitleLength: 80,
  maxNoteLength: 500,
} as const;

/* -------------------------------------------------------------------------- */
/* Local storage                                                              */
/* -------------------------------------------------------------------------- */

export const STORAGE_KEYS = {
  theme: "cadence.theme",
  lastVisitedDate: "cadence.last-visited-date",
} as const;
