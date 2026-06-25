import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { budgetSchema, expenseSchema } from "@/lib/validations";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const monthInput = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

function monthStart(month: string) {
    return new Date(`${month}-01T00:00:00.000Z`);
}

function nextMonth(month: string) {
    const start = monthStart(month);
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

export const financeRouter = createTRPCRouter({
    month: protectedProcedure.input(monthInput).query(async ({ ctx, input }) => {
        const start = monthStart(input.month);
        const end = nextMonth(input.month);
        const [budget, expenses] = await Promise.all([
            ctx.prisma.budget.findUnique({
                where: { userId_monthStart: { userId: ctx.user.id, monthStart: start } },
                include: { fixedCosts: true },
            }),
            ctx.prisma.expense.findMany({
                where: { userId: ctx.user.id, occurredOn: { gte: start, lt: end } },
                orderBy: { occurredOn: "desc" },
            }),
        ]);
        const previous = budget
            ? null
            : await ctx.prisma.budget.findFirst({
                where: { userId: ctx.user.id, monthStart: { lt: start } },
                orderBy: { monthStart: "desc" },
                include: { fixedCosts: true },
            });

        return {
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
    }),

    saveBudget: protectedProcedure.input(budgetSchema).mutation(async ({ ctx, input }) => {
        const start = monthStart(input.month);

        return ctx.prisma.$transaction(async (tx) => {
            const budget = await tx.budget.upsert({
                where: { userId_monthStart: { userId: ctx.user.id, monthStart: start } },
                create: { userId: ctx.user.id, monthStart: start, incomeCents: input.incomeCents },
                update: { incomeCents: input.incomeCents },
            });

            await tx.fixedExpense.deleteMany({ where: { budgetId: budget.id } });

            if (input.fixedCosts.length) {
                await tx.fixedExpense.createMany({
                    data: input.fixedCosts.map((cost) => ({
                        budgetId: budget.id,
                        name: cost.name,
                        amountCents: cost.amountCents,
                    })),
                });
            }

            return budget;
        });
    }),

    createExpense: protectedProcedure.input(expenseSchema).mutation(async ({ ctx, input }) =>
        ctx.prisma.expense.create({
            data: {
                userId: ctx.user.id,
                name: input.name,
                amountCents: Math.round(input.amount * 100),
                category: input.category,
                occurredOn: new Date(`${input.occurredOn}T12:00:00.000Z`),
                note: input.note || null,
            },
        }),
    ),

    updateExpense: protectedProcedure
        .input(expenseSchema.extend({ id: z.string().cuid() }))
        .mutation(async ({ ctx, input }) => {
            const found = await ctx.prisma.expense.findFirst({
                where: { id: input.id, userId: ctx.user.id },
            });

            if (!found) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.expense.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    amountCents: Math.round(input.amount * 100),
                    category: input.category,
                    occurredOn: new Date(`${input.occurredOn}T12:00:00.000Z`),
                    note: input.note || null,
                },
            });
        }),

    deleteExpense: protectedProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ ctx, input }) => {
        const result = await ctx.prisma.expense.deleteMany({
            where: { id: input.id, userId: ctx.user.id },
        });

        if (!result.count) {
            throw new TRPCError({ code: "NOT_FOUND" });
        }

        return { success: true };
    }),
});
