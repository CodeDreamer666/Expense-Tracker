import { z } from "zod";

export const fixedExpenseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Every fixed expense needs a name.")
        .max(40, "Fixed expense name cannot be longer than 40 characters."),

    amountCents: z
        .number()
        .int("Fixed expense amount must be a whole number of cents.")
        .positive("Fixed expense amount must be greater than 0."),
});

export const budgetSchema = z.object({
    month: z
        .string()
        .regex(/^\d{4}-\d{2}$/, "Invalid month format."),

    incomeCents: z
        .number()
        .int("Income must be a whole number of cents.")
        .positive("Monthly income must be greater than 0."),

    fixedCosts: z
        .array(fixedExpenseSchema)
        .max(20, "You can only add up to 20 fixed expenses."),
});

export const expenseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Expense name is required.")
        .max(80, "Expense name must be 80 characters or less."),

    amount: z
        .number({
            error: "Amount must be a number.",
        })
        .positive("Amount must be more than 0.")
        .max(10_000_000, "Amount is too large."),

    category: z.enum(
        [
            "Food",
            "Transport",
            "Books",
            "School",
            "Entertainment",
            "Subscription",
            "Shopping",
            "Other",
        ],
        {
            error: "Please choose a valid category.",
        }
    ),

    occurredOn: z
        .string()
        .date("Please choose a valid date."),
});
