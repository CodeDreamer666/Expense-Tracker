import { prisma } from "@/lib/prisma";

export type ClientExpense = {
    id: string;
    name: string;
    amountCents: number;
    category: string;
    occurredOn: string;
    note: string | null;
};

export type ClientFixedCost = {
    id: string;
    name: string;
    amountCents: number;
};

export type ClientMonthData = {
    month: string;
    budget: {
        id: string;
        incomeCents: number;
        fixedCosts: ClientFixedCost[];
    } | null;
    previousFixedCosts: ClientFixedCost[];
    expenses: ClientExpense[];
};

function startFor(month: string) {
    return new Date(`${month}-01T00:00:00.000Z`);
}

function endFor(month: string) {
    const date = startFor(month);
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date;
}

export async function getMonthData(userId: string, month: string): Promise<ClientMonthData> {
    const start = startFor(month);
    const [budget, expenses] = await Promise.all([
        prisma.budget.findUnique({
            where: {
                userId_monthStart: {
                    userId,
                    monthStart: start,
                },
            },
            include: {
                fixedCosts: true,
            },
        }),
        prisma.expense.findMany({
            where: {
                userId,
                occurredOn: {
                    gte: start,
                    lt: endFor(month),
                },
            },
            orderBy: {
                occurredOn: "desc",
            },
        }),
    ]);
    const previous = budget
        ? null
        : await prisma.budget.findFirst({
            where: {
                userId,
                monthStart: {
                    lt: start,
                },
            },
            orderBy: {
                monthStart: "desc",
            },
            include: {
                fixedCosts: true,
            },
        });

    return {
        month,
        budget: budget
            ? {
                id: budget.id,
                incomeCents: budget.incomeCents,
                fixedCosts: budget.fixedCosts.map((cost) => ({
                    id: cost.id,
                    name: cost.name,
                    amountCents: cost.amountCents,
                })),
            }
            : null,
        previousFixedCosts:
            previous?.fixedCosts.map((cost) => ({
                id: cost.id,
                name: cost.name,
                amountCents: cost.amountCents,
            })) ?? [],
        expenses: expenses.map((expense) => ({
            id: expense.id,
            name: expense.name,
            amountCents: expense.amountCents,
            category: expense.category,
            occurredOn: expense.occurredOn.toISOString().slice(0, 10),
            note: expense.note,
        })),
    };
}
