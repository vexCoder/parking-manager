import { DeviceStatus, LogAction, LogType } from "@app/commons";
import { z } from "zod";
import { middlewares } from "../middlewares";
import * as t from "../trpc";

const postSchema = z.object({
  deviceID: z.number(),
  status: z.enum([DeviceStatus.VACANT, DeviceStatus.OCCUPIED]),
});

const procedure = t.inject(middlewares.injectClient, middlewares.logger);
const protectedProcedure = t.inject(
  middlewares.injectClient,
  middlewares.authenticate,
  middlewares.logger
);

export const deviceRouter = t.router({
  post: procedure
    .input(postSchema)
    .mutation(async ({ input, ctx }) => {
      const { client } = ctx;
      let device = await client.device.findFirst({
        where: {
          deviceID: input.deviceID,
        },
      });
      
      console.log(device)

      if (!device) {
        device = await client.device.create({
          data: {
            deviceID: input.deviceID,
            name: `Device-${input.deviceID}`,
            status: input.status,
          },
        });
      } else {
        const find = await client.device.findFirst({
          where: {
            deviceID: input.deviceID,
          },
        });

        if (!find) return;

        device = await client.device.update({
          where: {
            id: find.id,
          },
          data: {
            status: input.status,
          },
        });
      }

      await client.log.create({
        data: {
          action:
            input.status === DeviceStatus.OCCUPIED
              ? LogAction.OCCUPIED
              : LogAction.VACANT,
          reference: device.id,
          type: LogType.DEVICE,
        },
      });

      return device;
    }),
  status: procedure
    .input(z.object({ deviceID: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const { client } = ctx;

      if(!input.deviceID) {
        return undefined
      }

      const device = await client.device.findFirst({
        where: {
          id: input.deviceID,
        },
      });
      console.log(device)

      if (!device) {
        throw new Error("Device not found");
      }

      return device;
    }),
  getDevices: procedure.query(async ({ ctx }) => {
    const { client } = ctx;
    const devices = await client.device.findMany({
      orderBy: {
        deviceID: "asc",
      },
    });

    const res = devices.map((v) => ({
      ...v,
      deviceID: parseInt(v.deviceID.toString(), 10),
    }));

    return res;
  }),
});
