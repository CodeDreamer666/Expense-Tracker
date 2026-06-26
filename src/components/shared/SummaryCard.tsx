import { type LucideIcon } from "lucide-react";

const toneClassNames = {
    sky: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
};

export function SummaryCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = "sky",
}: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    tone?: "sky" | "green" | "amber" | "rose" | "slate";
}) {
    return (
        <article className="flex min-h-32 items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <div className="min-w-0">
                <p className="text-sm text-slate-500">{label}</p>
                <strong className="mt-2 block truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    {value}
                </strong>
                <small className="mt-2 block text-xs leading-5 text-slate-500">
                    {hint}
                </small>
            </div>
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClassNames[tone]}`}>
                <Icon className="size-5" />
            </span>
        </article>
    );
}
