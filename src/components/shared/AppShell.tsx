"use client";

import { LayoutDashboard, LogOut, Menu, ReceiptText, Settings, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/better-auth/client";

const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/budget", label: "Budget", icon: WalletCards },
];

export function AppShell({
    children,
    user,
}: {
    children: React.ReactNode;
    user: { name: string; image?: string | null };
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    async function logout() {
        setBusy(true);
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
    }

    const nav = (
        <nav className="flex flex-col gap-1 md:flex-row md:items-center">
            {links.map(({ href, label, icon: Icon }) => (
                <Link
                    onClick={() => setOpen(false)}
                    key={href}
                    href={href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${pathname === href
                            ? "bg-sky-100 text-sky-700"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                >
                    <Icon className="size-4" />
                    {label}
                </Link>
            ))}
        </nav>
    );

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

                    <div className="hidden md:block">{nav}</div>

                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            onClick={logout}
                            disabled={busy}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOut className="size-4" />
                            {busy ? "Signing out" : "Log out"}
                        </button>
                    </div>

                    <button
                        className="grid cursor-pointer size-9 place-items-center rounded-lg bg-slate-100 text-slate-700 md:hidden"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-label="Toggle navigation"
                    >
                        {open ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>

                {open && (
                    <div className="mx-auto grid w-[min(1024px,calc(100%-32px))] gap-2 pb-4 md:hidden">
                        {nav}
                        <button
                            onClick={logout}
                            disabled={busy}
                            className="inline-flex cursor-pointer hover:bg-rose-100 duration-200 items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOut className="size-4" />
                            Log out
                        </button>
                    </div>
                )}
            </header>

            <main className="mx-auto w-[min(1024px,calc(100%-32px))] flex-1 py-7 md:py-10">
                {children}
            </main>
        </>
    );
}
