import { currentMonth } from "@/lib/money";
import { api } from "@/trpc/server";
import { MoneyClarityDashboard } from "./MoneyClarityDashboard";

export default async function Dashboard({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    const month = (await searchParams).month?.match(/^\d{4}-\d{2}$/)?.[0] ?? currentMonth();
    const data = await api.finance.month({ month });

    return (
        <MoneyClarityDashboard
            month={month}
            data={data}
        />
    );
}
