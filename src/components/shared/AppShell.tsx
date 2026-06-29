"use client";

import { LogOut, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/better-auth/client";

export function AppShell({
    children,
    user,
}: {
    children: React.ReactNode;
    user: { name: string; image?: string | null };
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function logout() {
        setBusy(true);
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
    }

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 w-[min(1024px,calc(100%-32px))] items-center justify-between gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 font-black tracking-tight text-slate-950"
                    >
                        <span className="grid size-9 place-items-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-200">
                            <WalletCards className="size-5" />
                        </span>
                        <b>Pocket Plan</b>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={logout}
                            disabled={busy}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOut className="size-4" />
                            {busy ? "Signing out" : "Log out"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-[min(1024px,calc(100%-32px))] flex-1 py-7 md:py-10">
                {children}
            </main>
        </>
    );
}
