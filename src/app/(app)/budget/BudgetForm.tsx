"use client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type { ClientFixedCost } from "@/types/type";
import { formatMoney } from "@/lib/money";
import { api } from "@/trpc/react";
import handleTRPCError from "@/lib/handleTRPCError";
import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { budgetSchema } from "@/lib/schema";
import { useStatusMessage } from "@/components/shared/StatusMessageRouter";

export function BudgetForm({
    month,
    incomeCents,
    fixedCosts,
    previous,
}: {
    month: string;
    incomeCents: number;
    fixedCosts: ClientFixedCost[];
    previous: ClientFixedCost[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const utils = api.useUtils();
    const { showMessage } = useStatusMessage();

    const [income, setIncome] = useState(incomeCents ? String(incomeCents / 100) : "");
    const [costs, setCosts] = useState<ClientFixedCost[]>(
        fixedCosts.length ? fixedCosts : previous.map((cost) => ({ ...cost, id: crypto.randomUUID() })),
    );
    const fixed = costs.reduce((sum, item) => sum + item.amountCents, 0);

    const saveBudget = api.finance.saveBudget.useMutation({
        onSuccess: async () => {
            router.push("/dashboard")
        },

        onError: (error) => {
            handleTRPCError({
                error, router, pathname, showMessage
            })
        },

        onSettled: async () => {
            await utils.finance.month.invalidate({ month });
        }
    });

    return (
        <div>
            <div className="flex justify-center sm:justify-end">
                <MonthSwitcher month={month} />
            </div>
            <form
                className="max-w-2xl mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();

                    const incomeValue = Math.round(Number(income) * 100);

                    const clean = costs
                        .filter((item) => item.name.trim() || item.amountCents)
                        .map((item) => ({ name: item.name.trim(), amountCents: item.amountCents }));

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
                }}
            >
                <div>
                    <p className="text-xs font-black tracking-wider text-sky-700">MONTHLY SETUP</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                        Set your monthly plan
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Fixed costs are committed first; the rest is available for daily spending.
                    </p>
                </div>

                <label className="mt-5 block text-sm font-black text-slate-700">
                    Monthly income
                    <input
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="0.00"
                    />
                </label>

                <div className="mt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-sm font-black text-slate-800">Fixed expenses</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Rent, transport, subscriptions-anything predictable.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-sky-700 transition hover:bg-sky-50"
                            onClick={() => setCosts((old) => [...old, { id: crypto.randomUUID(), name: "", amountCents: 0 }])}
                        >
                            <Plus className="size-4" />
                            Add cost
                        </button>
                    </div>

                    {costs.length === 0 && (
                        <p className="mt-3 text-sm text-slate-500">No fixed costs yet.</p>
                    )}

                    <div className="mt-3 grid gap-2">
                        {costs.map((cost) => (
                            <div
                                className="grid grid-cols-[1fr_112px_36px] items-center gap-2 sm:grid-cols-[1fr_140px_36px]"
                                key={cost.id}
                            >
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    maxLength={40}
                                    value={cost.name}
                                    onChange={(e) =>
                                        setCosts((old) =>
                                            old.map((item) => (item.id === cost.id ? { ...item, name: e.target.value } : item)),
                                        )
                                    }
                                    placeholder="Expense name"
                                />
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                    type="number"
                                    value={cost.amountCents ? cost.amountCents / 100 : ""}
                                    onChange={(e) =>
                                        setCosts((old) =>
                                            old.map((item) =>
                                                item.id === cost.id
                                                    ? { ...item, amountCents: Math.round(Number(e.target.value) * 100) }
                                                    : item,
                                            ),
                                        )
                                    }
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    className="grid size-9 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                    aria-label={`Remove ${cost.name || "fixed expense"}`}
                                    onClick={() => setCosts((old) => old.filter((item) => item.id !== cost.id))}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-sky-700">
                    <span className="text-sm font-bold">Available to spend</span>
                    <strong className="text-lg font-black">
                        {formatMoney(Math.round(Number(income || 0) * 100) - fixed)}
                    </strong>
                </div>

                <button
                    className="mt-4 cursor-pointer inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={saveBudget.isPending}
                >
                    {saveBudget.isPending ? "Saving..." : "Save monthly budget"}
                </button>
            </form>
        </div>
    );
}
