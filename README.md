<div align="center">

# Cadence

**Plan the week. Own the day.**

A calm, rewarding timetable tracker. Build a weekly rhythm once, tick off your
day as you go, and watch the streak grow.

</div>

---

## What it does

You define the blocks that repeat each week — *Study Java, Mon–Fri 09:00–11:00*;
*Company work, 13:00–18:00* — and Cadence materialises every day from that
template. Open it in the morning, tick things off as you finish them, and get an
honest picture of where your time actually went at the end of the week.

- **Weekly template, daily instances.** Set the rhythm once. Editing next week's
  plan never rewrites what last week actually looked like.
- **A check-off worth doing.** Confetti from the checkbox you tapped, a haptic
  tick on mobile, a progress ring that sweeps to full, and a bigger celebration
  when the whole day is done.
- **Streaks.** A day counts once you clear 60% of it, so one skipped block
  doesn't erase a good day. An unfinished today never breaks a streak — only a
  finished, failed yesterday does.
- **Weekly and monthly insights.** Completion trend, where your hours went by
  category, and a six-month consistency heatmap.
- **Real dark mode.** Not an inverted light theme — a separately tuned palette,
  including the chart colours.
- **Yours.** Your data lives in your own Firebase project. No third-party
  analytics, no tracking, no account on someone else's server.

## Tech

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, OKLCH design tokens |
| Components | Radix UI primitives, styled in-repo (shadcn/ui approach) |
| Charts | Recharts |
| Motion | Motion, canvas-confetti |
| Backend | Firebase Auth + Firestore |
| Hosting | Cloudflare Workers via OpenNext |

## Quick start

**Prerequisites:** Node.js 20+ and a Google account.

```bash
git clone https://github.com/ayyush-sharma/Cadence.git
cd Cadence
npm install
```

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and create
   a project.
2. Add a **Web app** to it (the `</>` icon). Copy the config values it shows you.
3. **Build → Authentication → Get started.** Enable **Email/Password** and
   **Google**.
4. **Build → Firestore Database → Create database.** Start in production mode;
   the rules are replaced in the next step.

### 2. Publish the security rules

The rules in [`firestore.rules`](firestore.rules) scope every document to its
owner. Paste them into **Firestore Database → Rules → Publish**, or run:

```bash
npx firebase deploy --only firestore:rules
```

> Without this step your database is either fully locked or fully open. Don't
> skip it.

### 3. Add your credentials

```bash
cp .env.example .env.local
```

Fill in the six values from step 1. Then:

```bash
npm run dev
```

Open <http://localhost:3000>. If anything is missing, the app shows a setup
checklist rather than an error.

## Deploying to Cloudflare

Cadence runs on Cloudflare Workers through
[OpenNext](https://opennext.js.org/cloudflare).

```bash
npm run cf:preview   # build and run the real Worker locally
npm run cf:deploy    # build and ship it
```

### Connecting the GitHub repo to Cloudflare

Create the project as a **Worker**, not a Pages site: **Workers & Pages →
Create → Workers → Import a repository**. Then set:

| Setting | Value |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Build output directory | *(leave empty)* |

> **Do not use `@cloudflare/next-on-pages`.** Cloudflare's dashboard may
> auto-detect Next.js and suggest it, but that is a different, legacy adapter.
> This project uses OpenNext (`wrangler.jsonc` + `open-next.config.ts`), and
> mixing the two fails during install with an `ERESOLVE` peer-dependency
> conflict between `wrangler` and `@cloudflare/workers-types`.
>
> A related symptom is the build log saying a Wrangler config file was found
> but *"does not appear to be valid… make sure it contains the
> `pages_build_output_dir` property"*. That means the project was created as
> **Pages**; recreate it as a **Worker**.

Two more things to get right:

1. **Environment variables.** Add all six `NEXT_PUBLIC_FIREBASE_*` values under
   **your project → Settings → Variables and Secrets**. They are needed *at
   build time* — Next inlines them into the client bundle, so a deploy without
   them builds fine but produces an app stuck on the setup screen.
2. **Authorised domains.** Add your `*.workers.dev` hostname (and any custom
   domain) under **Firebase → Authentication → Settings → Authorized domains**,
   or Google sign-in will be rejected.

### Why the app is client-rendered

Every page sits behind a client-only boundary
([`src/components/layout/client-page.tsx`](src/components/layout/client-page.tsx)).
This is deliberate and load-bearing: Firestore's Node build depends on
`@grpc/grpc-js`, which calls `new Function()` — something Cloudflare Workers
forbid. Keeping the Firebase SDK out of the server bundle avoids a
`Code generation from strings disallowed` error that appears **only at request
time**, not during the build. Nothing is lost, since every page renders
per-user data behind authentication.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run cf:preview` | Build and run the Worker locally |
| `npm run cf:deploy` | Build and deploy to Cloudflare |

## Project layout

```
src/
├── app/                    # Routes — thin; each renders one client page
├── components/
│   ├── auth/               # Sign-in screen, setup guide
│   ├── insights/           # Dashboard, charts, heatmap
│   ├── layout/             # App shell, nav, client boundary
│   ├── providers/          # Auth and theme context
│   ├── schedule/           # Weekly editor, block dialog, week grid
│   ├── today/              # Daily view and check-off
│   └── ui/                 # Reusable primitives
├── hooks/                  # Data hooks (blocks, day, insights, streak)
└── lib/
    ├── constants.ts        # ← every tunable value lives here
    ├── db.ts               # Firestore access layer
    ├── firebase.ts         # Lazy, browser-only SDK bootstrap
    ├── schedule.ts         # Pure scheduling + stats logic
    ├── time.ts             # Time and date helpers
    └── types.ts            # Domain types
```

Two conventions worth knowing before contributing:

- **`src/lib/constants.ts` is the single source of truth.** Colours, category
  definitions, streak thresholds, confetti parameters, grid hours, storage keys.
  If a value might reasonably be changed, it belongs there — not inline.
- **`schedule.ts` and `time.ts` are pure.** No React, no Firebase. They hold the
  logic that's worth reasoning about on its own.

### Data model

```
users/{uid}
├── blocks/{blockId}     # recurring weekly template
└── days/{YYYY-MM-DD}    # what actually happened that day
```

Times are stored as **minutes from local midnight** (`540` = 09:00), not
timestamps — a 09:00 block should still read 09:00 if you travel. Day documents
keep a snapshot of what was scheduled, so editing the template never rewrites
history.

## Accessibility

The six category colours are verified with a palette validator and pass checks
for lightness banding, chroma, colour-blind separation (protan/deutan/tritan),
and contrast — tuned separately per theme, since the safe lightness range
differs between light and dark surfaces. Colour is never the only signal: every
block and chart segment carries a text label. Reward animations respect
`prefers-reduced-motion`.

If you change the values in `CATEGORIES`, re-run a palette validation before
committing.

## Known issues

`npm audit` reports advisories in `undici`, reached through
`wrangler → miniflare`. These are **development and deploy tooling only** — none
of it ships in the application bundle. `npm audit fix --force` would downgrade
Wrangler to an older major version, which is worse; the advisories clear when
Wrangler updates its dependency upstream.

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
npm run lint && npm run typecheck && npm run build
```

## Licence

[MIT](LICENSE)
