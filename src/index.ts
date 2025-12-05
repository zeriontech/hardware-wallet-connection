import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
export function prepareBuffer(globalThisObject: any) {
  globalThisObject.Buffer = Buffer;
}
export {
  connectDevice,
  checkDevice,
  webHidIdentifier,
  webBleIdentifier,
} from "./device/connectDevice";
export type { TransportIdentifier } from "@ledgerhq/device-management-kit";
export { interpretError, deniedByUser, isConnectError } from "./device/errors";
export { getAddressesEth, getAddressesSolana } from "./device/addresses";
export { supportsLedger } from "./device/support";
export {
  signTransaction,
  signSolanaTransaction,
  serializeTransaction,
} from "./signing/signTransaction";
export { personalSign, signTypedData_v4 } from "./signing/signMessage";
