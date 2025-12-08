import { ethers, TypedDataDomain, TypedDataField } from "ethers";
import { dmk } from "../device/connectDevice";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import {
  LedgerError,
  parseLedgerError,
  REJECTED_BY_USER_ERROR,
  UserInteractionRequested,
} from "../device/helpers";

export async function personalSign(
  {
    derivationPath,
    message,
  }: {
    derivationPath: string;
    message: string;
  },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const { observable } = ethereumAppInstance.signMessage(
    derivationPath,
    message,
  );
  return new Promise<string>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            onInteractionRequested?.(requiredUserInteraction);
            break;
          }
          case DeviceActionStatus.Stopped: {
            reject(new LedgerError(REJECTED_BY_USER_ERROR));
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            resolve(ethers.Signature.from(output).serialized);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            reject(parseLedgerError(error));
            break;
          }
        }
      },
    });
  });
}

// Using types from ethers here to align with the types in the exernal code
interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  primaryType?: string;
}

export async function signTypedData_v4(
  {
    derivationPath,
    rawTypedData,
  }: {
    derivationPath: string;
    rawTypedData: string | TypedData;
  },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const typedData =
    typeof rawTypedData === "string" ? JSON.parse(rawTypedData) : rawTypedData;
  const { observable } = ethereumAppInstance.signTypedData(
    derivationPath,
    typedData,
  );
  return new Promise<string>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            onInteractionRequested?.(requiredUserInteraction);
            break;
          }
          case DeviceActionStatus.Stopped: {
            reject(new LedgerError(REJECTED_BY_USER_ERROR));
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            resolve(ethers.Signature.from(output).serialized);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            reject(parseLedgerError(error));
            break;
          }
        }
      },
    });
  });
}
