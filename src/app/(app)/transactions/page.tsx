import { getMonthData } from "@/lib/finance";
import { currentMonth } from "@/lib/money";
import { requireUser } from "@/lib/require-user";
import { TransactionManager } from "./TransactionManager";

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
    const user = await requireUser();
    const data = await getMonthData(user.id, month);

    return (
        <TransactionManager
            expenses={data.expenses}
            month={month}
        />
    );
}
