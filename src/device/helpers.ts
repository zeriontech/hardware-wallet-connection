export class LedgerError extends Error {
  errorCode?: string;
  _tag?: string;

  constructor(params: { message: string; errorCode?: string; _tag?: string }) {
    super(params.message);
    this.name = "LedgerError";
    this.errorCode = params.errorCode;
    this._tag = params._tag;
  }

  toString() {
    return `LedgerError: ${this.message}${
      this.errorCode ? ` (error code: ${this.errorCode})` : ""
    }${this._tag ? ` (tag: ${this._tag})` : ""}`;
  }
}

const USER_REJECTED_MESSAGE = "Condition not satisfied" as const;

export const REJECTED_BY_USER_ERROR = {
  message: USER_REJECTED_MESSAGE,
  _tag: "EthAppCommandError",
  errorCode: "6985",
} as const;

export function deniedByUser(error: LedgerError) {
  return error.message.startsWith(USER_REJECTED_MESSAGE);
}

export function getDeniedByUserError() {
  return new LedgerError(REJECTED_BY_USER_ERROR);
}

export type UserInteractionRequested =
  | "none"
  | "unlock-device"
  | "allow-secure-connection"
  | "confirm-open-app"
  | "sign-transaction"
  | "sign-typed-data"
  | "allow-list-apps"
  | "verify-address"
  | "sign-personal-message"
  | "sign-delegation-authorization"
  | "web3-checks-opt-in"
  | "verify-safe-address";

export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseLedgerError(error: unknown): LedgerError {
  if (typeof error === "string") {
    const ledgerErrorPattern =
      /^LedgerError:\s*(.+?)(?:\s*\(error code:\s*(.+?)\))?(?:\s*\(tag:\s*(.+?)\))?$/;
    const match = error.match(ledgerErrorPattern);

    if (match) {
      return new LedgerError({
        message: match[1].trim(),
        errorCode: match[2] || undefined,
        _tag: match[3] || undefined,
      });
    }

    return new LedgerError({ message: error });
  }
  return new LedgerError({
    message: (error as any)?.message || "Unknown error",
    errorCode:
      (error as any)?.originalError?.errorCode ||
      (error as any)?.errorCode ||
      undefined,
    _tag: (error as any)?._tag || undefined,
  });
}

export function hardwareWalletError(error: unknown): boolean {
  return error instanceof LedgerError;
}

export function getHardwareError(error: unknown): LedgerError | null {
  if (error instanceof LedgerError) {
    return error;
  }
  return null;
}
