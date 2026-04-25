/**
 * tRPC server-side client for Server Components
 */
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createTRPCContext } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";
import { createCallerFactory } from "@trpc/server";

/**
 * Create a server-side caller
 */
const createCaller = createCallerFactory()(appRouter);

/**
 * Create context for server-side calls
 */
const getContext = cache(async () => {
  return createTRPCContext({
    req: new Request("http://localhost:3000"),
    resHeaders: new Headers(),
  });
});

/**
 * Server-side tRPC caller
 */
export const serverTrpc = async () => {
  const context = await getContext();
  return createCaller(context);
};

/**
 * Hydration helpers for RSC
 */
export const { trpc: serverTrpcRsc, HydrateClient } = createHydrationHelpers<
  typeof appRouter
>({
  router: appRouter,
  createContext: getContext,
});
