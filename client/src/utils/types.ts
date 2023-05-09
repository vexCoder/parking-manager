import { AppRouter } from "@app/server/client";
import { inferProcedureOutput } from "@trpc/server";

export type Device = Omit<inferProcedureOutput<AppRouter["device"]["getDevices"]>[number], 'deviceID'> & {
    deviceID: number;
    createdAt: string;
    updatedAt: string;
};

export type Area = Exclude<inferProcedureOutput<AppRouter["parking"]["getArea"]>, null>

export type User = inferProcedureOutput<AppRouter["user"]["users"]>[number];