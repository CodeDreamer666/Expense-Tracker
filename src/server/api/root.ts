import { createTRPCRouter, createCallerFactory } from "@/server/api/trpc";
import { financeRouter } from "@/server/api/routers/finance";

export const appRouter = createTRPCRouter({ finance: financeRouter });
// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);