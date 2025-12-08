import type { UserInteractionRequired } from "@ledgerhq/device-management-kit";

export class LedgerError extends Error {
  errorCode?: string;
  _tag?: string;

  constructor(params: { message: string; errorCode?: string; _tag?: string }) {
    super(params.message);
    this.name = "LedgerError";
    this.errorCode = params.errorCode;
    this._tag = params._tag;
  }
}

const USER_REJECTED_ERROR_CODE = "6985" as const;

export const REJECTED_BY_USER_ERROR = {
  message: "Condition not satisfied",
  _tag: "EthAppCommandError",
  errorCode: USER_REJECTED_ERROR_CODE,
} as const;

export function deniedByUser(error: LedgerError) {
  return error.errorCode === USER_REJECTED_ERROR_CODE;
}

export type UserInteractionRequested = `${UserInteractionRequired}`;

export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseLedgerError(error: unknown): LedgerError {
  console.log("Parsing ledger error:", error);
  return new LedgerError({
    message: (error as any)?.message || "Unknown error",
    errorCode:
      (error as any)?.originalError?.errorCode ||
      (error as any)?.errorCode ||
      undefined,
    _tag: (error as any)?._tag || undefined,
  });
}
