"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Hexagon, Loader2 } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface Props {
  next: string;
}

export function SignInForm({ next }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const url = mode === "signin" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const body = mode === "signin" ? { email, password } : { email, password, name };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? `HTTP ${r.status}`);
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <Link
        href="/"
        className="text-foreground/70 hover:text-foreground mb-10 inline-flex items-center gap-2"
      >
        <Hexagon strokeWidth={1.4} className="size-5" />
        <span className="font-serif text-[18px] tracking-tight">Athena</span>
      </Link>

      <form
        onSubmit={submit}
        className={cn(
          "border-foreground/[0.08] bg-surface/60 flex w-full max-w-[400px] flex-col gap-4",
          "rounded-[20px] border p-6 backdrop-blur-sm",
        )}
      >
        <header>
          <h1 className="font-serif text-[24px] leading-tight tracking-tight">
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h1>
          <p className="text-foreground/55 mt-1 text-[12.5px]">
            {mode === "signin"
              ? "Use your fund credentials to access the deal workspace."
              : "We'll provision a fresh thesis you can configure right after."}
          </p>
        </header>

        {mode === "signup" && (
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={inputCn}
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={inputCn}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "signup" ? 8 : 1}
            className={inputCn}
          />
        </Field>

        {error && (
          <p className="border-warm/30 bg-warm/10 text-warm rounded-[10px] border px-3 py-2 text-[12px]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "bg-foreground text-background inline-flex items-center justify-center gap-1.5",
            "rounded-full px-4 py-2 text-[13px] font-medium",
            "hover:opacity-90 disabled:opacity-50",
          )}
        >
          {busy && <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
          }}
          className="text-foreground/55 hover:text-foreground text-[12px]"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputCn = cn(
  "border-foreground/[0.10] bg-foreground/[0.02] text-foreground",
  "rounded-[10px] border px-3 py-2 text-[13px]",
  "focus:border-foreground/30 focus:outline-none",
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-foreground/55 text-[10.5px] tracking-[0.14em] uppercase">{label}</span>
      {children}
    </label>
  );
}
