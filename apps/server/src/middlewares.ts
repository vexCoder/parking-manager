import { TRPCError } from "@trpc/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as t from "./trpc";
import { UserType } from "@app/commons";

export const injectClient = t.middleware(async (opts) => {
  const { client } = opts.ctx;
  await client.$connect();
  const res = await opts.next({
    ctx: {
      client,
    },
  });
  await client.$disconnect();
  return res;
});

export const logger = t.middleware(async (opts) => {
  // get time performance

  const start = performance.now();
  const res = await opts.next();
  const end = performance.now();

  console.log(
    `[${opts.path}] ${opts.type} ${JSON.stringify(opts.rawInput)} ${(
      end - start
    ).toFixed(2)}ms`
  );
  return res;
});

export const authenticate = t.middleware(async (opts) => {
  const { req, client } = opts.ctx;

  const token = req.cookies?.["qid"] || req.headers?.["authorization"]?.split(" ")[1];

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No Token Found" });
  }

  let decoded: JwtPayload | undefined
  try {
    decoded = jwt.verify(token, "secretkey") as JwtPayload;
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if(!decoded) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await client.user.findUnique({
    where: {
      id: decoded.user
    }
  })

  if(!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if(!user.approved) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Your account is not yet approved" });
  }

  const res = await opts.next({
    ctx: {
      authenticatedUser: user
    }
  });

  return res;
});

export const typeguard = (type: UserType) => t.middleware(async (opts) => {
  const { req, authenticatedUser } = opts.ctx;

  if (!authenticatedUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No Token Found" });
  }

  if (authenticatedUser.type !== type) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not authorized to access this resource" });
  }

  const res = await opts.next();

  return res;
});

export const middlewares = {
  injectClient,
  logger,
  authenticate,
  typeguard
};
