import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/misc";
import { APP } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP.name} — ${APP.tagline}`,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  openGraph: {
    title: `${APP.name} — ${APP.tagline}`,
    description: APP.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  // Matches the light/dark `--background` tokens so mobile browser chrome
  // blends with the page instead of banding against it.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a18" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // next-themes writes `class` and `style` on <html> before paint;
      // React would otherwise flag the difference during hydration.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* `AuthProvider` deliberately lives below the client-only boundary in
            `client-page.tsx`, not here, so the Firebase SDK never enters the
            server bundle. */}
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                className:
                  "!bg-surface-raised !text-foreground !border-border !shadow-lift !rounded-xl",
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
