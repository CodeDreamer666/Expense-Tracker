"use client";
import { Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { categories, type Category } from "@/lib/money";
import { expenseSchema } from "@/lib/schema";
import { api } from "@/trpc/react";
import { useStatusMessage } from "@/components/shared/StatusMessageRouter"
import handleTRPCError from "@/lib/handleTRPCError";


export function QuickExpenseButton({ month }: { month: string }) {
    const { showMessage } = useStatusMessage();
    const router = useRouter();
    const pathname = usePathname();
    const utils = api.useUtils();

    const [draft, setDraft] = useState({
        name: "",
        amount: "",
        category: "Food" as "Food" | "Transport" | "Books" | "School" | "Entertainment" | "Subscription" | "Shopping" | "Other",
        occurredOn: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Singapore",
        }),
    });
    const [isOpen, setIsOpen] = useState(false);

    const createExpense = api.finance.createExpense.useMutation({
        onSuccess: async () => {
            setIsOpen(false)
            router.refresh();
        },

        onError: async (error) => {
            handleTRPCError({
                error,
                router,
                pathname,
                showMessage
            })
        },

        onSettled: async () => {
            await utils.finance.month.invalidate({ month });
        }
    });

    return (
        <>
            <button
                className="flex cursor-pointer whitespace-nowrap items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="size-4" />
                Add expense
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-40 grid overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm place-items-center">
                    <form
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20"
                        onSubmit={(event) => {
                            event.preventDefault();

                            const result = expenseSchema.safeParse(draft);

                            if (!result.success) {
                                showMessage(result.error.issues[0].message, false);
                                return;
                            }

                            createExpense.mutate(result.data);
                        }}
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
                                className="grid cursor-pointer size-9 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                                onClick={() => setIsOpen(false)}
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

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
