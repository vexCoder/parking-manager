import { Area, Lot } from "@prisma/client";
import pMap from "p-map";
import { z } from "zod";
import { middlewares } from "../middlewares";
import * as t from "../trpc";

const upsertAreaSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  lots: z.array(
    z.object({
      id: z.number().optional(),
      startX: z.number(),
      startY: z.number(),
      endX: z.number(),
      endY: z.number(),
      device: z.number().optional(),
      deleted: z.boolean().optional(),
    })
  ),
});

const protectedProcedure = t.inject(
  middlewares.injectClient,
  middlewares.logger,
  middlewares.authenticate
);

export const parkingRouter = t.router({
  getArea: protectedProcedure.query(async ({ ctx }) => {
    const { client } = ctx;

    const area = await client.area.findFirst({});

    if (!area) return null;

    const lots = await client.lot.findMany({
      where: {
        areaId: area?.id,
      },
    });

    const lotsWithDevices = await pMap(lots, async (lot) => {
      const device = await client.device.findFirst({
        where: {
          lotId: lot.id,
        },
      });
      return {
        ...lot,
        device: device?.id,
      };
    });

    return {
      ...area,
      lots: lotsWithDevices,
    };
  }),
  upsertArea: protectedProcedure
    .input(upsertAreaSchema)
    .mutation(async ({ input, ctx }) => {
      const { client } = ctx;

      let area: Area | undefined;
      if (input.id) {
        area = await client.area.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            width: input.width,
            height: input.height,
          },
        });
      } else {
        area = await client.area.create({
          data: {
            name: input.name,
            width: input.width,
            height: input.height,
          },
        });
      }

      await pMap(
        input.lots,
        async ({ id, device, endX, endY, startX, startY, deleted }) => {
          let lot: Lot | undefined;

          console.log(id, deleted)

          const findLot = await client.lot.findFirst({
            where: {
              id,
            },
          });

          const lastDevice = await client.device.findFirst({
            where: {
              lotId: findLot?.id,
            },
          });

          if (!area) return;

          if (id && !deleted) {
            lot = await client.lot.update({
              where: {
                id,
              },
              data: {
                areaId: area.id,
                endX,
                endY,
                startX,
                startY,
              },
            });
          } else if (!id && !deleted) {
            lot = await client.lot.create({
              data: {
                areaId: area.id,
                endX,
                endY,
                startX,
                startY,
              },
            });
          } else if (id && deleted) {
            lot = await client.lot.delete({
              where: {
                id,
              },
            });
          }

          if (!lot) return lot;

          if (device) {
            await client.device.update({
              where: {
                id: device,
              },
              data: {
                lotId: deleted ? null : lot.id,
              },
            });
          } else if (lastDevice && !device) {
            await client.device.update({
              where: {
                id: lastDevice.id,
              },
              data: {
                lotId: null,
              },
            });
          } else if (deleted && lastDevice) {
            await client.device.update({
              where: {
                id: lastDevice.id,
              },
              data: {
                lotId: null,
              },
            });
          }

          return lot;
        },
        {
          concurrency: 1,
        }
      );
    }),
  deleteArea: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const { client } = ctx;

      await client.area.delete({
        where: {
          id: input,
        },
      });
    }),
});
