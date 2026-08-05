"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { InsightsView } from "@/components/insights/insights-view";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { TodayView } from "@/components/today/today-view";
import type { PageName } from "@/components/layout/client-page";

/**
 * Everything that depends on Firebase, mounted below a client-only boundary.
 *
 * `AuthProvider` lives here rather than in the root layout so the Firebase SDK
 * stays entirely out of the server bundle — see `client-page.tsx` for why that
 * matters on Cloudflare Workers.
 */
export function AppRoot({ page }: { page: PageName }) {
  return (
    <AuthProvider>
      <AppShell>
        {page === "today" ? <TodayView /> : null}
        {page === "schedule" ? <ScheduleView /> : null}
        {page === "insights" ? <InsightsView /> : null}
      </AppShell>
    </AuthProvider>
  );
}
