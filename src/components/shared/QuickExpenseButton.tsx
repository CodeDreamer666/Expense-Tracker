"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categories, type Category } from "@/lib/money";
import { trpc } from "@/trpc/react";

type Draft = {
    name: string;
    amount: string;
    category: Category;
    occurredOn: string;
    note: string;
};

function blankDraft(): Draft {
    return {
        name: "",
        amount: "",
        category: "Food",
        occurredOn: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Singapore",
        }),
        note: "",
    };
}

export function QuickExpenseButton({ month }: { month: string }) {
    const router = useRouter();
    const utils = trpc.useUtils();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [error, setError] = useState("");
    const createExpense = trpc.finance.createExpense.useMutation({
        onSuccess: async () => {
            setDraft(null);
            setError("");
            await utils.finance.month.invalidate({ month });
            router.refresh();
        },
        onError: (cause) => setError(cause.message),
    });

    function openModal() {
        setError("");
        setDraft(blankDraft());
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!draft) {
            return;
        }

        if (!draft.name.trim()) {
            setError("Expense name is required.");
            return;
        }

        if (!Number(draft.amount) || Number(draft.amount) <= 0) {
            setError("Amount must be greater than 0.");
            return;
        }

        createExpense.mutate({
            name: draft.name.trim(),
            amount: Number(draft.amount),
            category: draft.category,
            occurredOn: draft.occurredOn,
            note: draft.note.trim(),
        });
    }

    return (
        <>
            <button
                className="flex whitespace-nowrap items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={openModal}
            >
                <Plus className="size-4" />
                Add expense
            </button>

            {draft && (
                <div className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm sm:place-items-center">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={submit}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black tracking-wider text-sky-700">QUICK ADD</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                                    Add expense
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="grid size-9 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                onClick={() => setDraft(null)}
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <label className="mt-4 block text-sm font-black text-slate-700">
                            Expense name
                            <input
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                maxLength={80}
                                value={draft.name}
                                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                                autoFocus
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="mt-4 block text-sm font-black text-slate-700">
                                Amount
                                <input
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={draft.amount}
                                    onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                                />
                            </label>
                            <label className="mt-4 block text-sm font-black text-slate-700">
                                Category
                                <select
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    value={draft.category}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            category: event.target.value as Category,
                                        })
                                    }
                                >
                                    {categories.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="mt-4 block text-sm font-black text-slate-700">
                            Date
                            <input
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                type="date"
                                value={draft.occurredOn}
                                onChange={(event) => setDraft({ ...draft, occurredOn: event.target.value })}
                            />
                        </label>

                        <label className="mt-4 block text-sm font-black text-slate-700">
                            Note <em className="font-normal not-italic text-slate-400">(optional)</em>
                            <textarea
                                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                maxLength={240}
                                value={draft.note}
                                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                            />
                        </label>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                onClick={() => setDraft(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={createExpense.isPending}
                            >
                                {createExpense.isPending ? "Saving..." : "Save expense"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
