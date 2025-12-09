export { connectDevice, checkDevice, transports } from "./device/connectDevice";
export type { TransportIdentifier } from "./device/connectDevice";
export {
  deniedByUser,
  parseLedgerError,
  LedgerError,
  getDeniedByUserError,
} from "./device/helpers";
export type { UserInteractionRequested } from "./device/helpers";
export { getAddressesEth, getAddressesSolana } from "./device/addresses";
export { supportsLedger, supportsBluetooth } from "./device/support";
export {
  signTransaction,
  signSolanaTransaction,
} from "./signing/signTransaction";
export { personalSign, signTypedData_v4 } from "./signing/signMessage";
