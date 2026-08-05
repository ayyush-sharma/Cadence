<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cadence

A timetable tracker: a recurring weekly template, materialised into days you
tick off, plus weekly/monthly insights. Next.js 16 + TypeScript + Tailwind v4,
Firebase Auth/Firestore, deployed to Cloudflare Workers via OpenNext.

## Rules specific to this codebase

**Do not put Firebase in the server bundle.** Every page renders below the
client-only boundary in `src/components/layout/client-page.tsx` (`ssr: false`).
Firestore's Node build pulls in `@grpc/grpc-js`, which calls `new Function()` —
forbidden on Cloudflare Workers. The build still succeeds; it fails at request
time with `Code generation from strings disallowed`. If you add a page or move
`AuthProvider` up into the root layout, you will reintroduce this.

**Constants live in `src/lib/constants.ts`.** Colours, category definitions,
streak thresholds, confetti parameters, grid hours, storage keys, route
definitions. Don't inline these at usage sites.

**`src/lib/schedule.ts` and `src/lib/time.ts` are pure.** No React, no Firebase.
Keep them that way.

**Times are minutes from local midnight; dates are local `yyyy-MM-dd` keys.**
Never `toISOString()` a date for a key — it shifts the day for anyone west of
UTC in the evening. Use `toDateKey()` / `fromDateKey()`.

**History is immutable.** Day documents store a `scheduled` snapshot; past days
render from that, not from the live template. Editing the weekly plan must never
rewrite what a past day looked like.

**Category colours are validated.** The two ramps in `CATEGORIES` are separately
tuned per theme and pass colour-blind separation and contrast checks. If you
change them, re-validate — and never let colour become the only signal.

**React 19 lint rule.** `react-hooks/set-state-in-effect` is enforced. Derive
state during render, or tag async results with the key they belong to (see
`use-blocks.ts` for the pattern) rather than toggling a loading flag inside an
effect.

## Before committing

```bash
npm run lint && npm run typecheck && npm run build
```

For anything touching rendering or dependencies, also verify the real runtime —
a passing `next build` does not prove the Worker boots:

```bash
npm run cf:preview
```
