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

export async function signTransaction(
  derivationPath: string,
  rawTransaction: TransactionLike,
  sessionId: string,
) {
  console.log("Signing transaction:", rawTransaction, derivationPath);
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const { from, ...transactionWithoutFrom } = rawTransaction;
  const transaction = ethers.Transaction.from(transactionWithoutFrom);
  const uintArrayTx = hexaStringToBuffer(transaction.unsignedSerialized);
  console.log("About to sign");
  if (!uintArrayTx) {
    throw new Error("Failed to convert transaction to Uint8Array");
  }
  const { observable } = ethereumAppInstance.signTransaction(
    derivationPath,
    uintArrayTx,
  );
  return new Promise<{ serialized: string }>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The signing action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            // Access the intermediate value here, explained below
            console.log(
              "The signing action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The signing action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
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
            // Access the error here if occurred
            console.log("An error occurred during the signing action: ", error);
            // reject(error);
            break;
          }
        }
      },
    });
  });
}

export async function signSolanaTransaction(
  derivationPath: string,
  transaction: string,
  sessionId: string,
) {
  const solanaAppInstance = new SignerSolanaBuilder({ dmk, sessionId }).build();
  const uintArrayTx = base64StringToBuffer(transaction);
  if (!uintArrayTx) {
    throw new Error("Failed to convert transaction to Uint8Array");
  }
  console.log("Signing Solana transaction:");
  const { observable } = solanaAppInstance.signTransaction(
    derivationPath,
    uintArrayTx,
  );
  return new Promise<{ signature: Signature }>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The signing action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            // Access the intermediate value here, explained below
            console.log(
              "The signing action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The signing action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
            resolve({ signature: output });
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            // Access the error here if occurred
            console.log("An error occurred during the signing action: ", error);
            reject(error);
            break;
          }
        }
      },
    });
  });
}
