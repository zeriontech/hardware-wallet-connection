import { UserInteractionRequired } from "@ledgerhq/device-management-kit";

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
