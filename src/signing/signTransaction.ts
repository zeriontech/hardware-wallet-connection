import { TransactionRequest, ethers } from "ethers";
import type { UnsignedTransaction } from "@ethersproject/transactions";
import { serialize } from "@ethersproject/transactions";
import { BigNumber } from "@ethersproject/bignumber";
import { connectDevice } from "../device/connectDevice";

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
  transaction: IncomingTransaction
) {
  if (transaction.nonce == null) {
    throw new Error("'nonce' is a required property");
  }
  if (transaction.gasLimit == null) {
    throw new Error("'gasLimit' is a required property");
  }
  const { appEth } = await connectDevice();
  const serializedAsHex = await serializeTransaction(transaction);
  const normalizedTransaction = prepareForSerialization(transaction);
  const { r, s, v } = await appEth.signTransaction(
    derivationPath,
    serializedAsHex,
    null
  );
  const serialized = serialize(normalizedTransaction, {
    r: `0x${r}`,
    s: `0x${s}`,
    v: BigNumber.from(`0x${v}`).toNumber(),
  });
  return { serialized };
}
