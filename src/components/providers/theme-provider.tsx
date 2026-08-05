"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={STORAGE_KEYS.theme}
      // Cuts the CSS transition flash when switching themes.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

/** Hydration never changes after it happens, so nothing needs to be observed. */
const subscribeNoop = () => () => {};

/** Segmented light / dark / system switcher. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // The server can't know the resolved theme, so render a placeholder until
  // hydration. `useSyncExternalStore` returns the server snapshot during SSR
  // and the client one afterwards — the intended primitive for this, and it
  // avoids the extra render pass a mounted-flag effect would cause.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!hydrated) {
    return <div className="h-8 w-26 rounded-lg bg-surface-muted" />;
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5"
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            theme === value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
