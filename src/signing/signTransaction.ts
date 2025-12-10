import { TransactionLike, ethers } from "ethers";
import {
  DeviceActionStatus,
  hexaStringToBuffer,
  base64StringToBuffer,
} from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { dmk } from "../device/connectDevice";
import {
  Signature,
  SignerSolanaBuilder,
} from "@ledgerhq/device-signer-kit-solana";
import {
  LedgerError,
  parseLedgerError,
  REJECTED_BY_USER_ERROR,
  UserInteractionRequested,
} from "../device/helpers";

export function signTransaction(
  {
    derivationPath,
    rawTransaction,
  }: { derivationPath: string; rawTransaction: TransactionLike },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const { from, ...transactionWithoutFrom } = rawTransaction;
  const transaction = ethers.Transaction.from(transactionWithoutFrom);
  const uintArrayTx = hexaStringToBuffer(transaction.unsignedSerialized);

  if (!uintArrayTx) {
    throw new Error("Failed to convert transaction to Uint8Array");
  }

  const { observable, cancel } = ethereumAppInstance.signTransaction(
    derivationPath,
    uintArrayTx,
  );

  const promise = new Promise<{ serialized: string }>((resolve, reject) => {
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
            const signedTx = ethers.Transaction.from({
              ...transactionWithoutFrom,
              from,
              signature: output,
            });
            resolve({ serialized: signedTx.serialized });
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
  return { promise, cancel };
}

export function signSolanaTransaction(
  {
    derivationPath,
    transaction,
  }: { derivationPath: string; transaction: string },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  const solanaAppInstance = new SignerSolanaBuilder({ dmk, sessionId }).build();
  const uintArrayTx = base64StringToBuffer(transaction);

  if (!uintArrayTx) {
    throw new Error("Failed to convert transaction to Uint8Array");
  }

  const { observable, cancel } = solanaAppInstance.signTransaction(
    derivationPath,
    uintArrayTx,
  );

  const promise = new Promise<{ signature: Signature }>((resolve, reject) => {
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
            resolve({ signature: output });
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
  return { promise, cancel };
}
