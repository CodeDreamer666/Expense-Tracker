import { currentMonth } from "@/lib/money";
import { TransactionManager } from "./TransactionManager";
import { api } from "@/trpc/server"

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
    const data = await api.finance.month({ month })

    return (
        <TransactionManager
            expenses={data.expenses}
            month={month}
        />
    );
}
