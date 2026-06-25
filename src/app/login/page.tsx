"use client";

import { CircleUserRound, WalletCards } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError("");

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    if (result.error) {
      setError("Google sign-in could not start. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-2xl shadow-slate-200/70 sm:p-10">
        <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
          <WalletCards className="size-6" />
        </div>
        <p className="text-xs font-black tracking-wider text-sky-700">POCKET PLAN</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Your money, in focus.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Track your month with a private, simple plan for what you can safely spend.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <button
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={signIn}
          disabled={busy}
        >
          <CircleUserRound className="size-5 text-sky-600" />
          {busy ? "Connecting to Google..." : "Continue with Google"}
        </button>
        <small className="mt-5 block text-center text-xs text-slate-400">
          Your budget and expenses are private to your account.
        </small>
      </section>
    </main>
  );
}
