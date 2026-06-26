"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { formatMonth } from "@/lib/money";

export function MonthSwitcher({ month }: { month: string }) {
    const router = useRouter();
    const path = usePathname();

    function shift(delta: number) {
        const date = new Date(`${month}-01T12:00:00`);
        date.setMonth(date.getMonth() + delta);
        router.push(`${path}?month=${date.toISOString().slice(0, 7)}`);
    }

    return (
        <div className="flex w-full min-w-0 items-center rounded-xl border border-slate-200 bg-white shadow-sm sm:w-56">
            <button
                className="grid cursor-pointer size-10 shrink-0 place-items-center rounded-l-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                onClick={() => shift(-1)}
                aria-label="Previous month"
            >
                <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-black text-slate-800">
                {formatMonth(month)}
            </span>
            <button
                className="grid cursor-pointer size-10 shrink-0 place-items-center rounded-r-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                onClick={() => shift(1)}
                aria-label="Next month"
            >
                <ChevronRight className="size-5" />
            </button>
        </div>
    );
}
