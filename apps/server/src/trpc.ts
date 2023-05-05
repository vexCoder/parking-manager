import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { inferAsyncReturnType } from "@trpc/server";
import { PrismaClient, User } from "@prisma/client";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

export const createContext = (client: PrismaClient) => {
  return ({
    req,
    res,
  }: trpcExpress.CreateExpressContextOptions) => ({
      client,
      res,
      req,
      authenticatedUser: null as User | null | undefined,
  })
}; // no context

export type Context = inferAsyncReturnType<ReturnType<typeof createContext>> & {
  client: PrismaClient;
  authenticatedUser: User | null | undefined;
};

export const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const router = t.router;
export const procedure = t.procedure;

type Middleware = ReturnType<typeof middleware>

export const inject = (...middlewares: Middleware[]) => {
    let newProcedure = procedure;
    for (let i = 0; i < middlewares.length; i++) {
        const middleware = middlewares[i];
        newProcedure = newProcedure.use(middleware);
    }

    return newProcedure;
}
