"use client";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ClientExpense } from "@/types/type";
import { categories, formatMoney, type Category } from "@/lib/money";
import { QuickExpenseButton } from "../../../components/shared/QuickExpenseButton";
import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { api } from "@/trpc/react";
import handleTRPCError from "@/lib/handleTRPCError";
import { expenseSchema } from "@/lib/schema";
import { useStatusMessage } from "@/components/shared/StatusMessageRouter";


export function TransactionManager({
    expenses,
    month,
}: {
    expenses: ClientExpense[];
    month: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const utils = api.useUtils();

    const { showMessage } = useStatusMessage();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [selectedExpense, setSelectedExpense] = useState<{
        name: string;
        amount: string;
        category: Category;
        occurredOn: string;
    } | null>(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const visible = useMemo(() =>
        expenses.filter((item) =>
            (category === "All" || item.category === category) &&
            item.name.toLowerCase().includes(query.trim().toLowerCase()),
        ), [expenses, category, query]);

    const createExpense = api.finance.createExpense.useMutation({
        onSuccess: async () => {
            setSelectedExpense(null);
            setSelectedExpenseId("");
        },

        onError: (error) => {
            handleTRPCError({ error, router, pathname, showMessage })
        },

        onSettled: async () => {
            await utils.finance.month.invalidate({ month });
        }
    });

    const updateExpense = api.finance.updateExpense.useMutation({
        onSuccess: async () => {
            setSelectedExpense(null);
            setSelectedExpenseId("");
        },

        onError: (error) => {
            handleTRPCError({ error, router, pathname, showMessage })
        },

        onSettled: async () => {
            await utils.finance.month.invalidate({ month });
        }
    });

    const deleteExpense = api.finance.deleteExpense.useMutation({
        onSuccess: async () => {
            setDeleteId(null);
        },

        onError: (error) => {
            handleTRPCError({ error, router, pathname, showMessage })
        },

        onSettled: async () => {
            await utils.finance.month.invalidate({ month });
        }
    });

    const pending = createExpense.isPending || updateExpense.isPending || deleteExpense.isPending;

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
                        className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:w-44"
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
                                className="flex items-center gap-3 py-3"
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
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0 gap-1">
                                    <strong className="text-sm font-black text-slate-950">
                                        {formatMoney(expense.amountCents)}
                                    </strong>
                                    <button
                                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                        aria-label={`Edit ${expense.name}`}
                                        onClick={() => {
                                            setSelectedExpense({
                                                name: expense.name,
                                                amount: String(expense.amountCents / 100),
                                                category: expense.category as Category,
                                                occurredOn: expense.occurredOn,
                                            })
                                            setSelectedExpenseId(expense.id);
                                        }}
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
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

            {selectedExpense && (
                <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={(event) => {
                            event.preventDefault();

                            const result = expenseSchema.safeParse(selectedExpense);

                            if (!result.success) {
                                showMessage(result.error.issues[0].message, false);
                                return;
                            }

                            updateExpense.mutate({ ...result.data, id: selectedExpenseId })
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black tracking-wider text-sky-700">TRANSACTION</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                                    Edit expense
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="grid size-9 cursor-pointer place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                onClick={() => {
                                    setSelectedExpense(null)
                                    setSelectedExpenseId("");
                                }}
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <label className="mt-4 block text-sm font-black text-slate-700">
                            Expense name
                            <input
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                maxLength={80}
                                value={selectedExpense.name}
                                onChange={(event) => setSelectedExpense({ ...selectedExpense, name: event.target.value })}
                                autoFocus
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="mt-4 block text-sm font-black text-slate-700">
                                Amount
                                <input
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    type="number"
                                    value={selectedExpense.amount}
                                    onChange={(event) => setSelectedExpense({ ...selectedExpense, amount: event.target.value })}
                                />
                            </label>
                            <label className="mt-4 block text-sm font-black text-slate-700">
                                Category
                                <select
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    value={selectedExpense.category}
                                    onChange={(event) =>
                                        setSelectedExpense({
                                            ...selectedExpense,
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
                                value={selectedExpense.occurredOn}
                                onChange={(event) => setSelectedExpense({ ...selectedExpense, occurredOn: event.target.value })}
                            />
                        </label>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                                onClick={() => {
                                    setSelectedExpense(null)
                                    setSelectedExpenseId("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                                className="rounded-xl border cursor-pointer border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                                onClick={() => setDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-xl cursor-pointer bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={pending}
                                onClick={() => {
                                    deleteExpense.mutate({ id: selectedExpenseId })
                                }}
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
