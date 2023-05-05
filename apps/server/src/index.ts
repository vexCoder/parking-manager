import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors, { CorsOptions } from "cors";
import express from "express";
import session, { CookieOptions } from "express-session";
import _ from "lodash";
import { makeClient } from "./prisma";
import { deviceRouter } from "./routers/device.router";
import { parkingRouter } from "./routers/parking.router";
import { userRouter } from "./routers/user.router";
import * as t from "./trpc";

export const appRouter = t.router({
  user: userRouter,
  device: deviceRouter,
  parking: parkingRouter,
});

const main = async () => {
  const app = express();

  const client = makeClient();

  const store = new PrismaSessionStore(client, {
    checkPeriod: 2 * 60 * 1000, //ms
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  })

  const context = t.createContext(client);

  const corsOpts = {
    origin: "*",
    credentials: true,
  } as CorsOptions;

  const cookieOpts: CookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
    httpOnly: false,
    domain: "mapuark",
    sameSite: "lax" as const,
  };

  app.set("trust proxy", 1);

  app.use(cors(corsOpts));

  app.use(
    session({
      name: "qid",
      secret: "secret-key",
      resave: false,
      saveUninitialized: false,
      store,
      cookie: cookieOpts,
    })
  );

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: context
    })
  );

  app.listen(3002, () => {
    console.log("Server started on port 3002");
  });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
