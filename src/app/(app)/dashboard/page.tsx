import { ArrowDownRight, ArrowUpRight, CalendarDays, CreditCard, WalletCards } from "lucide-react";
import Link from "next/link";
import { BudgetUsedChart, ChartCard } from "@/components/shared/Charts";
import { EmptyState } from "@/components/shared/EmptyState";
import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { getMonthData } from "@/lib/finance";
import { currentMonth, formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/require-user";
import { QuickExpenseButton } from "../../../components/shared/QuickExpenseButton";
import { RecentExpenses } from "../../../components/shared/RecentExpenses";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
  const user = await requireUser();
  const data = await getMonthData(user.id, month);
  const income = data.budget?.incomeCents ?? 0;
  const fixed = data.budget?.fixedCosts.reduce((sum, item) => sum + item.amountCents, 0) ?? 0;
  const spent = data.expenses.reduce((sum, item) => sum + item.amountCents, 0);
  const available = income - fixed;
  const remaining = available - spent;
  const percent = available > 0 ? Math.min(100, (spent / available) * 100) : 0;
  const days = new Date().getDate();
  const left = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - days + 1;
  const daily = month === currentMonth() && available > 0 ? Math.max(0, remaining) / left : null;
  const tone = remaining < 0 || percent > 90 ? "#f43f5e" : percent >= 60 ? "#f59e0b" : "#0ea5e9";
  const status =
    remaining < 0 || percent > 90
      ? "Overspending - you are close to or past your limit"
      : percent >= 60
        ? "Be careful - your spending is getting high"
        : "Safe - you still have enough money left";

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-wider text-sky-700">MONTHLY OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Make room for what matters.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            See what is safe to spend, at a glance.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:justify-end">
          <QuickExpenseButton month={month} />
          <MonthSwitcher month={month} />
        </div>
      </section>

      {!data.budget && (
        <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <b className="text-sm font-black text-slate-950">
              Set your monthly income and fixed costs first.
            </b>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              We will calculate your available daily spending money from there.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
            href={`/budget?month=${month}`}
          >
            Set up budget
          </Link>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Monthly income"
          value={formatMoney(income)}
          hint="Your total income"
          icon={ArrowUpRight}
        />
        <SummaryCard
          label="Fixed expenses"
          value={formatMoney(fixed)}
          hint="Already committed"
          icon={CreditCard}
          tone="slate"
        />
        <SummaryCard
          label="Available to spend"
          value={formatMoney(available)}
          hint="Income minus fixed costs"
          icon={WalletCards}
        />
        <SummaryCard
          label="Spent this month"
          value={formatMoney(spent)}
          hint="Daily expenses only"
          icon={ArrowDownRight}
          tone={percent > 90 ? "rose" : percent >= 60 ? "amber" : "green"}
        />
        <SummaryCard
          label="Remaining balance"
          value={formatMoney(remaining)}
          hint="Available minus spending"
          icon={WalletCards}
          tone={remaining < 0 ? "rose" : "green"}
        />
        <SummaryCard
          label="Safe daily spending"
          value={daily === null ? "-" : formatMoney(daily)}
          hint={month === currentMonth() ? `${left} day${left === 1 ? "" : "s"} left this month` : "Current month only"}
          icon={CalendarDays}
          tone="amber"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Budget used"
          detail={status}
        >
          {data.budget ? (
            <BudgetUsedChart
              spent={spent}
              remaining={remaining}
              percent={percent}
              tone={tone}
            />
          ) : (
            <EmptyState
              title="No budget for this month"
              detail="Set your income and fixed costs to unlock your budget view."
            />
          )}
        </ChartCard>

        <RecentExpenses
          expenses={data.expenses}
          month={month}
        />
      </section>
    </>
  );
}
