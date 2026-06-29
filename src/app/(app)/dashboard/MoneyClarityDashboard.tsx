"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { useStatusMessage } from "@/components/shared/StatusMessageRouter";
import handleTRPCError from "@/lib/handleTRPCError";
import { categories, currentMonth, formatMoney, type Category } from "@/lib/money";
import { budgetSchema, expenseSchema } from "@/lib/schema";
import { api } from "@/trpc/react";
import type { ClientExpense, ClientFixedCost } from "@/types/type";

type ExpenseDraft = {
    name: string;
    amount: string;
    category: Category;
    occurredOn: string;
};

type MonthData = {
    budget: {
        id: string;
        incomeCents: number;
        fixedCosts: ClientFixedCost[];
    } | null;
    previousFixedCosts: ClientFixedCost[];
    expenses: ClientExpense[];
};

type ChartItem = {
    name: string;
    amount: number;
    fill: string;
};

const categoryColors = [
    "#0ea5e9",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#f43f5e",
    "#6366f1",
    "#14b8a6",
    "#64748b",
];

function blankExpenseDraft(): ExpenseDraft {
    return {
        name: "",
        amount: "",
        category: "Food",
        occurredOn: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Singapore",
        }),
    };
}

function percentOf(value: number, total: number) {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function ChartTooltip({
    active,
    payload,
    total,
}: {
    active?: boolean;
    payload?: {
        name: string;
        value: number;
        payload: ChartItem;
    }[];
    total: number;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0];

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg shadow-slate-200/80">
            <p className="font-black text-slate-950">{item.name}</p>
            <p className="mt-1 text-slate-500">
                {formatMoney(item.value)} - {percentOf(item.value, total)}%
            </p>
        </div>
    );
}

function MoneyOverviewChart({
    spent,
    remaining,
}: {
    spent: number;
    remaining: number;
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const remainingValue = Math.max(0, remaining);
    const total = spent + remainingValue;
    const data: ChartItem[] = total
        ? [
            {
                name: "Spent",
                amount: spent,
                fill: "#0ea5e9",
            },
            {
                name: "Remaining",
                amount: remainingValue,
                fill: "#10b981",
            },
        ]
        : [
            {
                name: "No budget yet",
                amount: 1,
                fill: "#e2e8f0",
            },
        ];

    return (
        <div className="h-72 min-w-0">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={74}
                        outerRadius={106}
                        paddingAngle={3}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        {data.map((item, index) => (
                            <Cell
                                key={item.name}
                                fill={item.fill}
                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.42}
                                stroke={activeIndex === index ? "#0f172a" : "#ffffff"}
                                strokeWidth={activeIndex === index ? 3 : 1}
                            />
                        ))}
                    </Pie>
                    {total > 0 && (
                        <Tooltip content={<ChartTooltip total={total} />} />
                    )}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

function CategorySpendingChart({ data }: { data: ChartItem[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    if (!data.length) {
        return (
            <EmptyState
                title="No spending data yet"
                detail="Add expenses to reveal your category breakdown."
            />
        );
    }

    return (
        <div className="h-72 min-w-0">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={104}
                        paddingAngle={2}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        {data.map((item, index) => (
                            <Cell
                                key={item.name}
                                fill={item.fill}
                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                stroke={activeIndex === index ? "#0f172a" : "#ffffff"}
                                strokeWidth={activeIndex === index ? 3 : 1}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip total={total} />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function MoneyClarityDashboard({
    month,
    data,
}: {
    month: string;
    data: MonthData;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const utils = api.useUtils();
    const { showMessage } = useStatusMessage();
    const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>(blankExpenseDraft);
    const [editingExpense, setEditingExpense] = useState<ExpenseDraft | null>(null);
    const [editingExpenseId, setEditingExpenseId] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [income, setIncome] = useState(data.budget?.incomeCents ? String(data.budget.incomeCents / 100) : "");
    const [costs, setCosts] = useState<ClientFixedCost[]>(
        data.budget?.fixedCosts.length
            ? data.budget.fixedCosts
            : data.previousFixedCosts.map((cost) => ({
                ...cost,
                id: crypto.randomUUID(),
            })),
    );

    const fixed = data.budget?.fixedCosts.reduce((sum, item) => sum + item.amountCents, 0) ?? 0;
    const draftFixed = costs.reduce((sum, item) => sum + item.amountCents, 0);
    const incomeCents = data.budget?.incomeCents ?? 0;
    const available = Math.max(0, incomeCents - fixed);
    const spent = data.expenses.reduce((sum, item) => sum + item.amountCents, 0);
    const remaining = available - spent;
    const days = new Date().getDate();
    const left = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - days + 1;
    const daily = month === currentMonth() && available > 0 ? Math.max(0, remaining) / left : null;
    const categoryTotals = useMemo(() => {
        return Object.entries(
            data.expenses.reduce<Record<string, number>>((map, item) => {
                return {
                    ...map,
                    [item.category]: (map[item.category] ?? 0) + item.amountCents,
                };
            }, {}),
        )
            .map(([name, amount], index) => ({
                name,
                amount,
                fill: categoryColors[index % categoryColors.length],
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [data.expenses]);
    const biggestCategory = categoryTotals[0];
    const visibleExpenses = useMemo(() => {
        return data.expenses.filter((item) => {
            const matchesCategory = category === "All" || item.category === category;
            const matchesQuery = item.name.toLowerCase().includes(query.trim().toLowerCase());

            return matchesCategory && matchesQuery;
        });
    }, [data.expenses, category, query]);

    async function refreshMonth() {
        await utils.finance.month.invalidate({ month });
        router.refresh();
    }

    function handleMutationError(error: unknown) {
        handleTRPCError({
            error,
            router,
            pathname,
            showMessage,
        });
    }

    function closeExpenseModal() {
        setExpenseModalOpen(false);
        setExpenseDraft(blankExpenseDraft());
    }

    function closeBudgetModal() {
        setBudgetModalOpen(false);
    }

    const createExpense = api.finance.createExpense.useMutation({
        onSuccess: async () => {
            closeExpenseModal();
            showMessage("Expense added", true);
            await refreshMonth();
        },
        onError: handleMutationError,
    });

    const updateExpense = api.finance.updateExpense.useMutation({
        onSuccess: async () => {
            setEditingExpense(null);
            setEditingExpenseId("");
            showMessage("Expense updated", true);
            await refreshMonth();
        },
        onError: handleMutationError,
    });

    const deleteExpense = api.finance.deleteExpense.useMutation({
        onSuccess: async () => {
            setDeleteId(null);
            showMessage("Expense deleted", true);
            await refreshMonth();
        },
        onError: handleMutationError,
    });

    const saveBudget = api.finance.saveBudget.useMutation({
        onSuccess: async () => {
            closeBudgetModal();
            showMessage("Monthly plan saved", true);
            await refreshMonth();
        },
        onError: handleMutationError,
    });

    const expensePending = createExpense.isPending || updateExpense.isPending || deleteExpense.isPending;

    function submitExpense(event: React.FormEvent) {
        event.preventDefault();

        const result = expenseSchema.safeParse({
            ...expenseDraft,
            amount: Number(expenseDraft.amount),
        });

        if (!result.success) {
            showMessage(result.error.issues[0].message, false);
            return;
        }

        createExpense.mutate(result.data);
    }

    function submitEditExpense(event: React.FormEvent) {
        event.preventDefault();

        if (!editingExpense) {
            return;
        }

        const result = expenseSchema.safeParse({
            ...editingExpense,
            amount: Number(editingExpense.amount),
        });

        if (!result.success) {
            showMessage(result.error.issues[0].message, false);
            return;
        }

        updateExpense.mutate({
            ...result.data,
            id: editingExpenseId,
        });
    }

    function submitBudget(event: React.FormEvent) {
        event.preventDefault();

        const incomeValue = Math.round(Number(income) * 100);
        const clean = costs
            .filter((item) => item.name.trim() || item.amountCents)
            .map((item) => ({
                name: item.name.trim(),
                amountCents: item.amountCents,
            }));
        const result = budgetSchema.safeParse({
            month,
            incomeCents: incomeValue,
            fixedCosts: clean,
        });

        if (!result.success) {
            showMessage(result.error.issues[0].message, false);
            return;
        }

        saveBudget.mutate(result.data);
    }

    return (
        <>
            <section className="mb-6 flex flex-col gap-5">
                <div>
                    <p className="text-xs font-black tracking-wider text-sky-700">MONEY CLARITY</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        What is safe to spend?
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        See the month clearly, add expenses only when you need to, and move on.
                    </p>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-center">
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                        onClick={() => setBudgetModalOpen(true)}
                    >
                        Edit Budget
                    </button>
                    <MonthSwitcher month={month} />
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => setExpenseModalOpen(true)}
                    >
                        <Plus className="size-4" />
                        Add Expense
                    </button>
                </div>
            </section>

            {!data.budget && (
                <section className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/80 p-5">
                    <b className="text-sm font-black text-slate-950">
                        Set your income and fixed costs to unlock the full monthly picture.
                    </b>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Use the Edit Budget button above whenever your monthly plan changes.
                    </p>
                </section>
            )}

            <section className="grid gap-5">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_1fr] lg:items-center">
                        <div>
                            <p className="text-xs font-black tracking-wider text-sky-700">MONEY OVERVIEW</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                                {formatMoney(Math.max(0, remaining))} left to spend
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Spent and remaining money are compared against your available money after fixed expenses.
                            </p>
                            <MoneyOverviewChart
                                spent={spent}
                                remaining={remaining}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ["Income", incomeCents],
                                ["Fixed expenses", fixed],
                                ["Available money", available],
                                ["Spent", spent],
                                ["Remaining", remaining],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-2xl bg-slate-50 px-4 py-3"
                                >
                                    <p className="text-xs font-bold text-slate-500">{label}</p>
                                    <strong className="mt-1 block text-lg font-black text-slate-950">
                                        {formatMoney(Number(value))}
                                    </strong>
                                </div>
                            ))}
                            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sky-700">
                                <p className="text-xs font-bold">Safe per day</p>
                                <strong className="mt-1 block text-lg font-black">
                                    {daily === null ? "-" : formatMoney(daily)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_1fr] lg:items-center">
                        <div>
                            <p className="text-xs font-black tracking-wider text-sky-700">WHERE IT WENT</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                                Spending by category
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Hover a segment to see its share of monthly spending.
                            </p>
                            <CategorySpendingChart data={categoryTotals} />
                        </div>

                        {categoryTotals.length ? (
                            <div className="grid gap-2">
                                {categoryTotals.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                                    >
                                        <span
                                            className="size-3 rounded-full"
                                            style={{ background: item.fill }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-black text-slate-950">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {percentOf(item.amount, spent)}% of spending
                                            </p>
                                        </div>
                                        <strong className="text-sm font-black text-slate-950">
                                            {formatMoney(item.amount)}
                                        </strong>
                                    </div>
                                ))}
                                {biggestCategory && (
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Biggest category:{" "}
                                        <b className="text-slate-950">{biggestCategory.name}</b>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                title="No category totals yet"
                                detail="Add expenses to see where your money went."
                            />
                        )}
                    </div>
                </article>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-black tracking-wider text-sky-700">RECENT EXPENSES</p>
                            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                                What you spent on
                            </h2>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <label className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 sm:w-56">
                                <Search className="ml-3 size-4 shrink-0 text-slate-400" />
                                <input
                                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-950 outline-none"
                                    placeholder="Search"
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
                    </div>

                    {visibleExpenses.length ? (
                        <div className="divide-y divide-slate-100">
                            {visibleExpenses.slice(0, 10).map((expense) => (
                                <article
                                    key={expense.id}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sm font-black text-sky-700">
                                        {expense.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <b className="block truncate text-sm font-black text-slate-950">
                                            {expense.name}
                                        </b>
                                        <p className="mt-1 truncate text-xs text-slate-500">
                                            {expense.category} -{" "}
                                            {new Intl.DateTimeFormat("en-SG", {
                                                day: "numeric",
                                                month: "short",
                                            }).format(new Date(`${expense.occurredOn}T12:00:00`))}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <strong className="text-sm font-black text-slate-950">
                                            {formatMoney(expense.amountCents)}
                                        </strong>
                                        <button
                                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                            aria-label={`Edit ${expense.name}`}
                                            onClick={() => {
                                                setEditingExpense({
                                                    name: expense.name,
                                                    amount: String(expense.amountCents / 100),
                                                    category: expense.category as Category,
                                                    occurredOn: expense.occurredOn,
                                                });
                                                setEditingExpenseId(expense.id);
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
                            title={data.expenses.length ? "No matching expenses" : "No expenses yet"}
                            detail={data.expenses.length ? "Try a quieter search or category." : "Add your first expense to start tracking your spending."}
                        />
                    )}
                </section>
            </section>

            {expenseModalOpen && (
                <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={submitExpense}
                    >
                        <ModalHeader
                            eyebrow="ADD EXPENSE"
                            title="Record spending"
                            onClose={closeExpenseModal}
                        />

                        <ExpenseFields
                            draft={expenseDraft}
                            onChange={setExpenseDraft}
                        />

                        <ModalActions
                            onCancel={closeExpenseModal}
                            pending={createExpense.isPending}
                            submitLabel="Save expense"
                            pendingLabel="Saving..."
                        />
                    </form>
                </div>
            )}

            {budgetModalOpen && (
                <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
                    <form
                        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={submitBudget}
                    >
                        <ModalHeader
                            eyebrow="EDIT BUDGET"
                            title="Monthly plan"
                            onClose={closeBudgetModal}
                        />

                        <label className="mt-4 block text-sm font-black text-slate-700">
                            Monthly income
                            <input
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                type="number"
                                value={income}
                                onChange={(event) => setIncome(event.target.value)}
                                placeholder="0.00"
                            />
                        </label>

                        <div className="mt-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Fixed expenses</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        These are subtracted before daily spending.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-black text-sky-700 transition hover:bg-sky-50"
                                    onClick={() =>
                                        setCosts((old) => [
                                            ...old,
                                            {
                                                id: crypto.randomUUID(),
                                                name: "",
                                                amountCents: 0,
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="size-4" />
                                    Add
                                </button>
                            </div>

                            <div className="mt-3 grid gap-2">
                                {costs.map((cost) => (
                                    <div
                                        className="grid grid-cols-[1fr_108px_34px] items-center gap-2 sm:grid-cols-[1fr_140px_34px]"
                                        key={cost.id}
                                    >
                                        <input
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            maxLength={40}
                                            value={cost.name}
                                            onChange={(event) =>
                                                setCosts((old) =>
                                                    old.map((item) =>
                                                        item.id === cost.id
                                                            ? {
                                                                ...item,
                                                                name: event.target.value,
                                                            }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            placeholder="Name"
                                        />
                                        <input
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            type="number"
                                            value={cost.amountCents ? cost.amountCents / 100 : ""}
                                            onChange={(event) =>
                                                setCosts((old) =>
                                                    old.map((item) =>
                                                        item.id === cost.id
                                                            ? {
                                                                ...item,
                                                                amountCents: Math.round(Number(event.target.value) * 100),
                                                            }
                                                            : item,
                                                    ),
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                        <button
                                            type="button"
                                            className="grid size-9 cursor-pointer place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                            aria-label={`Remove ${cost.name || "fixed expense"}`}
                                            onClick={() => setCosts((old) => old.filter((item) => item.id !== cost.id))}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-sky-50 px-4 py-3 text-sky-700">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-bold">Draft available money</span>
                                <strong className="text-sm font-black">
                                    {formatMoney(Math.round(Number(income || 0) * 100) - draftFixed)}
                                </strong>
                            </div>
                        </div>

                        <ModalActions
                            onCancel={closeBudgetModal}
                            pending={saveBudget.isPending}
                            submitLabel="Save monthly plan"
                            pendingLabel="Saving..."
                        />
                    </form>
                </div>
            )}

            {editingExpense && (
                <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={submitEditExpense}
                    >
                        <ModalHeader
                            eyebrow="EDIT EXPENSE"
                            title="Update spending"
                            onClose={() => {
                                setEditingExpense(null);
                                setEditingExpenseId("");
                            }}
                        />

                        <ExpenseFields
                            draft={editingExpense}
                            onChange={setEditingExpense}
                        />

                        <ModalActions
                            onCancel={() => {
                                setEditingExpense(null);
                                setEditingExpenseId("");
                            }}
                            pending={expensePending}
                            submitLabel="Save expense"
                            pendingLabel="Saving..."
                        />
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
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                                onClick={() => setDeleteId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={expensePending}
                                onClick={() => deleteExpense.mutate({ id: deleteId })}
                            >
                                {deleteExpense.isPending ? "Deleting..." : "Delete expense"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ModalHeader({
    eyebrow,
    title,
    onClose,
}: {
    eyebrow: string;
    title: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs font-black tracking-wider text-sky-700">{eyebrow}</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    {title}
                </h2>
            </div>
            <button
                type="button"
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                onClick={onClose}
                aria-label="Close"
            >
                <X className="size-4" />
            </button>
        </div>
    );
}

function ExpenseFields({
    draft,
    onChange,
}: {
    draft: ExpenseDraft;
    onChange: (draft: ExpenseDraft) => void;
}) {
    return (
        <>
            <label className="mt-4 block text-sm font-black text-slate-700">
                Expense name
                <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    maxLength={80}
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                    autoFocus
                />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
                <label className="mt-4 block text-sm font-black text-slate-700">
                    Amount
                    <input
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        type="number"
                        value={draft.amount}
                        onChange={(event) => onChange({ ...draft, amount: event.target.value })}
                    />
                </label>
                <label className="mt-4 block text-sm font-black text-slate-700">
                    Category
                    <select
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        value={draft.category}
                        onChange={(event) =>
                            onChange({
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
                    onChange={(event) => onChange({ ...draft, occurredOn: event.target.value })}
                />
            </label>
        </>
    );
}

function ModalActions({
    onCancel,
    pending,
    submitLabel,
    pendingLabel,
}: {
    onCancel: () => void;
    pending: boolean;
    submitLabel: string;
    pendingLabel: string;
}) {
    return (
        <div className="mt-5 flex justify-end gap-2">
            <button
                type="button"
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                onClick={onCancel}
            >
                Cancel
            </button>
            <button
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending}
            >
                {pending ? pendingLabel : submitLabel}
            </button>
        </div>
    );
}
