import { AlertTriangle } from "lucide-react";
import { APP } from "@/lib/constants";

/** Environment variables the app needs, shown in the setup guide. */
const REQUIRED_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

/**
 * Shown when Firebase credentials are missing.
 *
 * A fresh clone has no `.env.local`, so this replaces an opaque SDK crash with
 * instructions — the first thing a new contributor sees should be actionable.
 */
export function SetupGuide() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Finish setting up {APP.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Firebase credentials are missing.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-4 text-sm">
          <Step n={1}>
            Create a project at{" "}
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              console.firebase.google.com
            </a>
            , then add a <strong>Web app</strong> to it.
          </Step>
          <Step n={2}>
            Under <strong>Build → Authentication</strong>, enable the{" "}
            <strong>Email/Password</strong> and <strong>Google</strong>{" "}
            providers.
          </Step>
          <Step n={3}>
            Under <strong>Build → Firestore Database</strong>, create a
            database, then publish the rules from{" "}
            <code className="text-xs">firestore.rules</code>.
          </Step>
          <Step n={4}>
            Copy <code className="text-xs">.env.example</code> to{" "}
            <code className="text-xs">.env.local</code> and fill in these values
            from your Firebase web app config:
            <ul className="mt-2 space-y-1 rounded-lg border border-border bg-surface-muted p-3 font-mono text-[11px] text-muted-foreground">
              {REQUIRED_ENV.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </Step>
          <Step n={5}>
            Restart the dev server so the new variables are picked up.
          </Step>
        </ol>

        <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          Full instructions are in the project README.
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-muted text-[11px] font-medium text-muted-foreground">
        {n}
      </span>
      <span className="leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}
