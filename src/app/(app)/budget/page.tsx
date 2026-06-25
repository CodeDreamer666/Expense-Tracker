import { MonthSwitcher } from "@/components/shared/MonthSwitcher";
import { getMonthData } from "@/lib/finance";
import { currentMonth } from "@/lib/money";
import { requireUser } from "@/lib/require-user";
import { BudgetForm } from "./BudgetForm";

export default async function BudgetPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
    const user = await requireUser();
    const data = await getMonthData(user.id, month);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="mb-2 flex justify-end">
                <MonthSwitcher month={month} />
            </div>

            <BudgetForm
                month={month}
                incomeCents={data.budget?.incomeCents ?? 0}
                fixedCosts={data.budget?.fixedCosts ?? []}
                previous={data.previousFixedCosts}
            />
        </div>
    );
}
