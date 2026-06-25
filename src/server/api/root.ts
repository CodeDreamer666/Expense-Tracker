import { createTRPCRouter } from "@/server/api/trpc";
import { financeRouter } from "@/server/api/routers/finance";

export const appRouter = createTRPCRouter({ finance: financeRouter });
export type AppRouter = typeof appRouter;
