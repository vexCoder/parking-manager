import { z } from "zod";
import { middlewares } from "../middlewares";
import * as t from "../trpc";
import { LogAction, LogType, UserType } from "@app/commons";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import pMap from "p-map";
import moment from "moment";
import { Log, User } from "@prisma/client";
import _ from "lodash";

const registerSchema = z
  .object({
    username: z.string({ required_error: "Username is required" }),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters long" }),
    type: z.enum([UserType.ADMIN, UserType.USER], {
      required_error: "Type is required",
    }),
    name: z.string({ required_error: "Name is required" }),
    college: z.string({ required_error: "College is required" }),
  })
  .required();

const procedure = t.inject(middlewares.injectClient, middlewares.logger);
const protectedProcedure = t.inject(
  middlewares.injectClient,
  middlewares.logger,
  middlewares.authenticate
);
const adminProcedure = t.inject(
  middlewares.injectClient,
  middlewares.logger,
  middlewares.authenticate,
  middlewares.typeguard(UserType.ADMIN)
);

export const userRouter = t.router({
  register: procedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const { client } = ctx;

    const hashedPassword = await argon2.hash(input.password);
    const reference = Math.random().toString(36).substring(2, 12);

    const user = await client.user.create({
      data: {
        ...input,
        password: hashedPassword,
        reference,
        approved: false,
      },
    });

    return user;
  }),
  login: procedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { client, res, req } = ctx;

      const user = await client.user.findUnique({
        where: {
          username: input.username,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.approved) {
        throw new Error("User not yet approved");
      }

      const valid = await argon2.verify(user.password, input.password);

      const signed = jwt.sign({ user: user.id }, "secretkey", {
        expiresIn: "24h",
      });

      res.cookie("qid", signed, {
        httpOnly: true,
        secure: false,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxAge: 3600000,
      });

      if (!valid) {
        throw new Error("Invalid password");
      }

      return signed;
    }),
  log: adminProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { client, res, req } = ctx;

      const user = await client.user.findUnique({
        where: {
          reference: input.reference,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const lastLog = (
        await client.log.findMany({
          where: {
            reference: user.id,
            type: LogType.USER,
            action: {
              in: [LogAction.ENTER, LogAction.EXIT],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        })
      )[0];

      let action = LogAction.ENTER;

      if (lastLog)
        action =
          lastLog.action === LogAction.ENTER ? LogAction.EXIT : LogAction.ENTER;

      const log = await client.log.create({
        data: {
          reference: user.id,
          type: LogType.USER,
          action,
        },
      });

      return log;
    }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { res } = ctx;

    res.clearCookie("qid");

    return true;
  }),
  status: protectedProcedure.query(async ({ input, ctx }) => {
    const { client, authenticatedUser } = ctx;

    if (!authenticatedUser) throw new Error("User not found");

    const user = await client.user.findUnique({
      where: {
        id: authenticatedUser.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }),
  getLogs: adminProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const logs = await ctx.client.log.findMany({});
    const selected = moment(input, "X");

    const mappedLogs = await pMap(logs, async (log) => {
      const isBetween = moment(log.createdAt).isBetween(
        selected.clone().startOf("day"),
        selected.clone().endOf("day"),
        "day",
        "[]"
      );

      if (!isBetween) {
        return null;
      }

      if (log.type === LogType.USER) {
        const user = await ctx.client.user.findUnique({
          where: {
            id: log.reference,
          },
        });

        if (!user) return null;

        return {
          ...log,
          user: user.name,
        };
      }

      if (log.type === LogType.DEVICE) {
        const device = await ctx.client.device.findUnique({
          where: {
            id: log.reference,
          },
        });

        if (!device) return null;

        return {
          ...log,
          device: device.deviceID,
        };
      }

      return null;
    });

    const filtered = mappedLogs.filter((log) => log !== null) as Log[];

    const offset = 2;

    // time ranges
    const ranges = new Array(24 / offset)
      .fill(0)
      .map((_, i) => i * offset)
      .map((hour) => {
        return {
          start: hour,
          end: hour + offset,
          label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${
            hour < 12 ? "am" : "pm"
          }`,
        };
      });

    const values = ranges.map((range) => {
      const logs = filtered.filter((log) => {
        const hour = moment(log.createdAt).hour();
        return (
          hour >= range.start && hour < range.end && log.type === LogType.USER
        );
      });

      return {
        label: range.label,
        value: logs?.length ?? 0,
      };
    });

    const valuesVacancy = ranges.map((range) => {
      const logs = filtered.filter((log) => {
        const hour = moment(log.createdAt).hour();
        console.log(hour);
        return (
          hour >= range.start &&
          hour < range.end &&
          log.type === LogType.DEVICE &&
          log.action === LogAction.VACANT
        );
      });

      return {
        label: range.label,
        value: logs?.length ?? 0,
      };
    });

    return {
      vacancy: valuesVacancy,
      entries: values,
    };
  }),
  approvalStats: adminProcedure.query(async ({ input, ctx }) => {
    const users = await ctx.client.user.findMany();

    const approved = users.filter((user) => user.approved).length;
    const pending = users.filter((user) => !user.approved).length;

    return {
      approved,
      pending,
    };
  }),
  users: adminProcedure.query(async ({ input, ctx }) => {
    const users = await ctx.client.user.findMany({});

    return users;
  }),
  approve: adminProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
    const { client } = ctx;

    const user = await client.user.findFirst({
      where: {
        id: input,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await client.user.update({
      where: {
        id: input,
      },
      data: {
        approved: true,
      },
    });

    return updatedUser;
  }),
  colleges: adminProcedure.query(async ({ input, ctx }) => {
    const users = await ctx.client.user.findMany({});

    const mapped = _.groupBy(
      users.filter((v) => v.type === UserType.USER),
      (v) => v.college
    );

    return mapped as Record<string, User[]>;
  }),
});
