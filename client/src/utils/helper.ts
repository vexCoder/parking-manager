import { TRPCClientError, TRPCClientErrorLike } from "@trpc/client";

export const extractError = (error: TRPCClientErrorLike<any>) => {
  try {
    const [parsed] = JSON.parse(error.message) as [TRPCClientError<any>];
    return parsed?.message ?? error.message;
  } catch (er) {
    return error.message;
  }
};
