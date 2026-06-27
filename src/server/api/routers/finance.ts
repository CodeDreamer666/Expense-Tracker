import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { budgetSchema, expenseSchema } from "@/lib/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import sanitizeHtml from 'sanitize-html';

function monthStart(month: string) {
    return new Date(`${month}-01T00:00:00.000Z`);
}

function nextMonth(month: string) {
    const start = monthStart(month);
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

export const financeRouter = createTRPCRouter({
    month: protectedProcedure
        .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
        .query(async ({ ctx, input }) => {
            const start = monthStart(input.month);
            const end = nextMonth(input.month);

            const [budget, expenses] = await Promise.all([
                ctx.db.budget.findUnique({
                    where: { userId_monthStart: { userId: ctx.session.user.id, monthStart: start } },
                    include: { fixedCosts: true },
                }),
                ctx.db.expense.findMany({
                    where: { userId: ctx.session.user.id, occurredOn: { gte: start, lt: end } },
                    orderBy: { occurredOn: "desc" },
                }),
            ]);

            const previous = budget
                ? null
                : await ctx.db.budget.findFirst({
                    where: { userId: ctx.session.user.id, monthStart: { lt: start } },
                    orderBy: { monthStart: "desc" },
                    include: { fixedCosts: true },
                });

            return {
                budget: budget
                    ? {
                        id: budget.id,
                        incomeCents: budget.incomeCents,
                        fixedCosts: budget.fixedCosts.map((cost: {
                            name: string;
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            amountCents: number;
                            budgetId: string;
                        }) => ({
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
                })),
            };
        }),

    saveBudget: protectedProcedure
        .input(budgetSchema)
        .mutation(async ({ ctx, input }) => {
            const start = monthStart(input.month);

            await ctx.db.$transaction(async (tx) => {
                const budget = await tx.budget.upsert({
                    where: {
                        userId_monthStart: {
                            userId: ctx.session.user.id,
                            monthStart: start
                        }
                    },
                    create: {
                        userId: ctx.session.user.id,
                        monthStart: start,
                        incomeCents: input.incomeCents
                    },
                    update: {
                        incomeCents: input.incomeCents
                    },
                });

                await tx.fixedExpense.deleteMany({
                    where: {
                        budgetId: budget.id
                    }
                });

                if (input.fixedCosts.length) {
                    await tx.fixedExpense.createMany({
                        data: input.fixedCosts.map((cost) => {
                            const cleanName = sanitizeHtml(cost.name, {
                                allowedAttributes: {},
                                allowedTags: []
                            });

                            return {
                                budgetId: budget.id,
                                name: cleanName,
                                amountCents: cost.amountCents,
                            }
                        }),
                    });
                }

                return budget;
            });

            return {
                success: true
            }
        }),

    createExpense: protectedProcedure
        .input(expenseSchema)
        .mutation(async ({ ctx, input }) => {
            const cleanExpenseName = sanitizeHtml(input.name, {
                allowedAttributes: {},
                allowedTags: []
            });

            await ctx.db.expense.create({
                data: {
                    userId: ctx.session.user.id,
                    name: cleanExpenseName,
                    amountCents: Math.round(input.amount * 100),
                    category: input.category,
                    occurredOn: new Date(`${input.occurredOn}T12:00:00.000Z`),
                },
            })

            return {
                success: true
            }
        }),

    updateExpense: protectedProcedure
        .input(expenseSchema.extend({ id: z.string().cuid() }))
        .mutation(async ({ ctx, input }) => {
            const found = await ctx.db.expense.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id
                },
            });

            if (!found) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
            }

            const cleanExpenseName = sanitizeHtml(input.name, {
                allowedAttributes: {},
                allowedTags: []
            });


            await ctx.db.expense.update({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id
                },
                data: {
                    name: cleanExpenseName,
                    amountCents: Math.round(input.amount * 100),
                    category: input.category,
                    occurredOn: new Date(`${input.occurredOn}T12:00:00.000Z`),
                },
            });

            return {
                success: true
            }
        }),

    deleteExpense: protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(async ({ ctx, input }) => {

            const result = await ctx.db.expense.deleteMany({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id
                },
            });

            if (!result.count) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found " });
            }

            return { success: true };
        }),
});
