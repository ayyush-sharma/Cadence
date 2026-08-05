"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarRange,
  ChartNoAxesColumn,
  LogOut,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/providers/theme-provider";
import { AuthScreen } from "@/components/auth/auth-screen";
import { SetupGuide } from "@/components/auth/setup-guide";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { APP, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Maps the icon names in `NAV_ITEMS` to components, keeping constants serialisable. */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  CalendarCheck,
  CalendarRange,
  ChartNoAxesColumn,
};

/**
 * Application chrome and access gate.
 *
 * Three states are handled before any page renders: Firebase not configured,
 * auth still resolving, and signed out.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, configured, logOut } = useAuth();

  if (!configured) return <SetupGuide />;
  if (loading) return <BootSkeleton />;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onSignOut={logOut} />
      {/* Bottom padding clears the mobile tab bar. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Header({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
            <CalendarCheck className="size-4" />
          </span>
          <span className="text-sm">{APP.name}</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-muted text-foreground"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void onSignOut()}
            aria-label="Sign out"
            title={user?.email ?? "Sign out"}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar, shown only on small screens. */
function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-stretch">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-accent" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function BootSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-8 grid gap-3">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
