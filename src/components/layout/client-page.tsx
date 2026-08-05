"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry point for every page.
 *
 * `ssr: false` here is load-bearing, not an optimisation. The shell and all
 * three views reach Firebase, and Firestore's Node build depends on
 * `@grpc/grpc-js`, which calls `new Function()` — disallowed on Cloudflare
 * Workers ("Code generation from strings disallowed"). That failure appears
 * only at request time; the build itself succeeds either way. Keeping this
 * subtree out of the server graph means the grpc build is never bundled or
 * evaluated on the server.
 *
 * Nothing is lost by skipping SSR: every page sits behind authentication and
 * renders per-user data, so there is no meaningful HTML to prerender.
 */

export type PageName = "today" | "schedule" | "insights";

const AppRoot = dynamic(
  () => import("@/components/layout/app-root").then((m) => m.AppRoot),
  { ssr: false, loading: () => <PageSkeleton /> },
);

export function ClientPage({ page }: { page: PageName }) {
  return <AppRoot page={page} />;
}

/** Neutral placeholder shown while the app chunk loads. */
function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-56 animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-20 w-full animate-pulse rounded-xl bg-surface-muted"
          />
        ))}
      </div>
    </div>
  );
}
