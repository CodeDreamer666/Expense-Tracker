export type ClientExpense = {
    id: string;
    name: string;
    amountCents: number;
    category: string;
    occurredOn: string;
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