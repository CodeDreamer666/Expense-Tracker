"use client";

import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ClientExpense } from "@/lib/finance";
import { categories, formatMoney, type Category } from "@/lib/money";
import { QuickExpenseButton } from "../../../components/shared/QuickExpenseButton";
import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { trpc } from "@/trpc/react";

type Draft = {
    id?: string;
    name: string;
    amount: string;
    category: Category;
    occurredOn: string;
    note: string;
};

export function TransactionManager({
    expenses,
    month,
}: {
    expenses: ClientExpense[];
    month: string;
}) {
    const router = useRouter();
    const utils = trpc.useUtils();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const visible = useMemo(
        () =>
            expenses.filter(
                (item) =>
                    (category === "All" || item.category === category) &&
                    item.name.toLowerCase().includes(query.trim().toLowerCase()),
            ),
        [expenses, category, query],
    );

    async function refreshMonth() {
        await utils.finance.month.invalidate({ month });
        router.refresh();
    }

    const createExpense = trpc.finance.createExpense.useMutation({
        onSuccess: async () => {
            setDraft(null);
            setError("");
            await refreshMonth();
        },
        onError: (cause) => setError(cause.message),
    });
    const updateExpense = trpc.finance.updateExpense.useMutation({
        onSuccess: async () => {
            setDraft(null);
            setError("");
            await refreshMonth();
        },
        onError: (cause) => setError(cause.message),
    });
    const deleteExpense = trpc.finance.deleteExpense.useMutation({
        onSuccess: async () => {
            setDeleteId(null);
            setError("");
            await refreshMonth();
        },
        onError: (cause) => {
            setDeleteId(null);
            setError(cause.message);
        },
    });

    useEffect(() => {
        const hasOpenModal = Boolean(draft || deleteId);

        if (!hasOpenModal) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [draft, deleteId]);

    const pending = createExpense.isPending || updateExpense.isPending || deleteExpense.isPending;

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

        const payload = {
            name: draft.name.trim(),
            amount: Number(draft.amount),
            category: draft.category,
            occurredOn: draft.occurredOn,
            note: draft.note.trim(),
        };

        if (draft.id) {
            updateExpense.mutate({ ...payload, id: draft.id });
        } else {
            createExpense.mutate(payload);
        }
    }

    function destroy() {
        if (!deleteId) {
            return;
        }

        deleteExpense.mutate({ id: deleteId });
    }

    return (
        <>
            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-black tracking-wider text-sky-700">FULL HISTORY</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        Transactions
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Search, adjust, and clean up every expense from {month}.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:justify-end">
                    <QuickExpenseButton month={month} />
                    <MonthSwitcher month={month} />
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <label className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                        <Search className="ml-3 size-4 shrink-0 text-slate-400" />
                        <input
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none"
                            placeholder="Search transactions"
                            value={query}
                            maxLength={80}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </label>
                    <select
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:w-44"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                    >
                        <option>All</option>
                        {categories.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </div>

                {visible.length ? (
                    <div className="divide-y divide-slate-100">
                        {visible.map((expense) => (
                            <article
                                key={expense.id}
                                className="flex items-center gap-3 py-3 sm:items-center"
                            >
                                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sm font-black text-sky-700">
                                    {expense.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <b className="truncate text-sm font-black text-slate-950">
                                        {expense.name}
                                    </b>
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {expense.category} -{" "}
                                        {new Intl.DateTimeFormat("en-SG", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        }).format(new Date(`${expense.occurredOn}T12:00:00`))}
                                        {expense.note ? ` - ${expense.note}` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0 gap-1">
                                    <strong className="text-sm font-black text-slate-950">
                                        {formatMoney(expense.amountCents)}
                                    </strong>
                                    <button
                                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                        aria-label={`Edit ${expense.name}`}
                                        onClick={() =>
                                            setDraft({
                                                id: expense.id,
                                                name: expense.name,
                                                amount: String(expense.amountCents / 100),
                                                category: expense.category as Category,
                                                occurredOn: expense.occurredOn,
                                                note: expense.note ?? "",
                                            })
                                        }
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        className="grid size-8 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                        aria-label={`Delete ${expense.name}`}
                                        onClick={() => setDeleteId(expense.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title={expenses.length ? "No matching transactions" : "No transactions yet"}
                        detail={expenses.length ? "Try a different search or category." : "Add your first expense to start tracking your spending."}
                    />
                )}
            </section>

            {draft && (
                <div className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm sm:place-items-center">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={submit}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black tracking-wider text-sky-700">TRANSACTION</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                                    {draft.id ? "Edit expense" : "Add expense"}
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
                                disabled={pending}
                            >
                                {pending ? "Saving..." : "Save expense"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20">
                        <h2 className="text-xl font-black tracking-tight text-slate-950">
                            Delete this expense?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This action cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                onClick={() => setDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={pending}
                                onClick={destroy}
                            >
                                {pending ? "Deleting..." : "Delete expense"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
