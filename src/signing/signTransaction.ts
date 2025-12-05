import { TransactionRequest, ethers } from "ethers";
import type { UnsignedTransaction } from "@ethersproject/transactions";
import { serialize } from "@ethersproject/transactions";
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

enum ChainId {
  arbitrum = 42161,
  base = 8453,
  optimism = 10,
  zora = 7777777,
}

const LEGACY_CHAINS = new Set([
  ChainId.arbitrum,
  ChainId.optimism,
  ChainId.zora,
  ChainId.base,
]);

type IncomingTransaction = TransactionRequest & { to: null | string };

function prepareForSerialization(transaction: IncomingTransaction) {
  const tx: UnsignedTransaction = {
    chainId: transaction.chainId
      ? ethers.toNumber(transaction.chainId)
      : undefined,
    data: transaction.data || undefined,
    to: transaction.to || undefined,
    gasLimit: transaction.gasLimit || undefined,
    nonce: transaction.nonce ?? undefined,
    value: transaction.value || undefined,
  };
  const isLegacyType = LEGACY_CHAINS.has(tx.chainId as ChainId);
  if (transaction.gasPrice) {
    tx.gasPrice = transaction.gasPrice;
  } else if (!isLegacyType) {
    tx.maxFeePerGas = transaction.maxFeePerGas || undefined;
    tx.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas || undefined;
    tx.type = 2;
  } else {
    tx.gasPrice = transaction.maxFeePerGas || undefined;
  }
  return tx;
}

export async function serializeTransaction(transaction: IncomingTransaction) {
  const tx = prepareForSerialization(transaction);
  const serializedAsHex = serialize(tx);
  return serializedAsHex.slice(2); // strip "0x" prefix
}

export async function signTransaction(
  derivationPath: string,
  transaction: IncomingTransaction,
  sessionId: string,
) {
  console.log("Signing transaction:", transaction, derivationPath);
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  if (transaction.nonce == null) {
    throw new Error("'nonce' is a required property");
  }
  if (transaction.gasLimit == null) {
    throw new Error("'gasLimit' is a required property");
  }
  // const { appEth } = await connectDevice();
  const serializedAsHex = await serializeTransaction(transaction);
  const uintArrayTx = hexaStringToBuffer(serializedAsHex);
  const normalizedTransaction = prepareForSerialization(transaction);
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
          case "pending": {
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
          case "stopped": {
            console.log("The signing action has been stopped.");
            break;
          }
          case "completed": {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
            const { r, s, v } = output;
            const serialized = serialize(normalizedTransaction, {
              r,
              s,
              v,
            });
            resolve({ serialized });
            break;
          }
          case "error": {
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
          case "pending": {
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
          case "stopped": {
            console.log("The signing action has been stopped.");
            break;
          }
          case "completed": {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
            resolve({ signature: output });
            break;
          }
          case "error": {
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
