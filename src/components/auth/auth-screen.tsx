"use client";

import { useState, type FormEvent } from "react";
import { CalendarCheck, Flame, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { APP } from "@/lib/constants";
import { friendlyAuthError } from "@/lib/errors";

type Mode = "signin" | "signup";

/** Sign-in and registration screen shown to signed-out visitors. */
export function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
    } catch (submitError) {
      setError(friendlyAuthError(submitError));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(friendlyAuthError(googleError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* Decorative backdrop: grid fading out toward the edges. */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />

      <div className="relative grid w-full max-w-4xl gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
        <section className="hidden md:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" />
            Open source · Free forever
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            {APP.tagline}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {APP.description}
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              {
                Icon: CalendarCheck,
                title: "One rhythm, every week",
                body: "Set your recurring blocks once. Each day builds itself.",
              },
              {
                Icon: Flame,
                title: "Streaks that stick",
                body: "Tick a block, feel it land. Miss nothing, build momentum.",
              },
              {
                Icon: Sparkles,
                title: "Honest reflection",
                body: "Weekly and monthly summaries of where your hours went.",
              },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-lift sm:p-8">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <CalendarCheck className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">{APP.name}</span>
          </div>

          <h2 className="text-lg font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin"
              ? "Pick up where you left off."
              : "Start building your weekly rhythm."}
          </p>

          <Button
            variant="secondary"
            className="mt-6 w-full"
            onClick={() => void handleGoogle()}
            disabled={busy}
          >
            <GoogleMark />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wide text-subtle-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />
            </Field>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

/** Inline Google "G" so the button needs no external image request. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.71v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.17a6.9 6.9 0 0 1 0-4.34V6.85H1.71a11.5 11.5 0 0 0 0 10.3l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.3 15.11.25 12 .25A11.5 11.5 0 0 0 1.71 6.85l3.84 2.98C6.46 7.11 9 5.08 12 5.08Z"
      />
    </svg>
  );
}
