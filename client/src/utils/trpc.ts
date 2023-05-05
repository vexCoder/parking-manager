import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@app/server/client";

export const trpc = createTRPCReact<AppRouter>();
