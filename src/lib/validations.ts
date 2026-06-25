import { z } from "zod";

const money = z.number().finite().positive().max(10_000_000);

export const fixedExpenseSchema = z.object({
    name: z.string().trim().min(1).max(40),
    amountCents: z.number().int().positive(),
});

export const budgetSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    incomeCents: z.number().int().positive(),
    fixedCosts: z.array(fixedExpenseSchema).max(20),
});

export const expenseSchema = z.object({
    name: z.string().trim().min(1).max(80),
    amount: money,
    category: z.enum([
        "Food",
        "Transport",
        "Books",
        "School",
        "Entertainment",
        "Subscription",
        "Shopping",
        "Other",
    ]),
    occurredOn: z.string().date(),
    note: z.string().trim().max(240).optional(),
});
