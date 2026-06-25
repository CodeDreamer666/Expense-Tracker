import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ClientExpense } from "@/lib/finance";
import { formatMoney } from "@/lib/money";

export function RecentExpenses({
  expenses,
  month,
}: {
  expenses: ClientExpense[];
  month: string;
}) {
  const recent = expenses.slice(0, 5);

  return (
    <section className="min-h-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wider text-sky-700">RECENT ACTIVITY</p>
          <h2 className="mt-1 text-base font-black tracking-tight text-slate-950">
            Recent expenses
          </h2>
        </div>
        <Link
          href={`/transactions?month=${month}`}
          className="rounded-lg px-2 py-1 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
        >
          View all
        </Link>
      </div>

      {recent.length ? (
        <div className="divide-y divide-slate-100">
          {recent.map((expense) => (
            <article
              key={expense.id}
              className="flex items-center gap-3 py-3"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sm font-black text-sky-700">
                {expense.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <b className="truncate text-sm font-black text-slate-950">
                    {expense.name}
                  </b>
                  <strong className="shrink-0 text-sm font-black text-slate-950">
                    {formatMoney(expense.amountCents)}
                  </strong>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {expense.category} -{" "}
                  {new Intl.DateTimeFormat("en-SG", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(`${expense.occurredOn}T12:00:00`))}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No expenses yet"
          detail="Add your first expense to see recent activity here."
        />
      )}
    </section>
  );
}
