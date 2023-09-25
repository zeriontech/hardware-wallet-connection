import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
export function prepareBuffer(globalThisObject: any) {
  globalThisObject.Buffer = Buffer;
}
export { connectDevice, checkDevice } from "./device/connectDevice";
export { interpretError, deniedByUser } from "./device/errors";
export { getAddressByDerivationPath, getAddresses } from "./device/addresses";
export { supportsLedger } from "./device/support";
