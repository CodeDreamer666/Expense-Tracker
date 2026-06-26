import { currentMonth } from "@/lib/money";
import { BudgetForm } from "./BudgetForm";
import { api } from "@/trpc/server";

export default async function BudgetPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
    const data = await api.finance.month({ month })

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <BudgetForm
                month={month}
                incomeCents={data.budget?.incomeCents ?? 0}
                fixedCosts={data.budget?.fixedCosts ?? []}
                previous={data.previousFixedCosts}
            />
        </div>
    );
}
