import { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { DefaultSignerSolana } from "@ledgerhq/device-signer-kit-solana/internal/DefaultSignerSolana.js";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { dmk } from "./connectDevice";
import { SignerSolanaBuilder } from "@ledgerhq/device-signer-kit-solana";
import {
  UserInteractionRequested,
  LedgerError,
  REJECTED_BY_USER_ERROR,
} from "./helpers";

const paths = {
  ledger: (index: number) => `44'/60'/0'/${index}`,
  ledgerLive: (index: number) => `44'/60'/${index}'/0/0`,
  bip44: (index: number) => `44'/60'/0'/0/${index}`,
  solanaBip44Change: (index: number) => `44'/501'/${index}'/0'`,
  solanaBip44: (index: number) => `44'/501'/${index}'`,
  solanaDeprecated: (index: number) => `44'/501'/${index}'/0'/0'`,
};

type PathType = keyof typeof paths;

function getDerivationPath(type: PathType, accountIndex: number) {
  return paths[type](accountIndex);
}

async function getAddressByDerivationPath({
  signer,
  derivationPath,
  onInteractionRequested,
}: {
  signer: DefaultSignerEth;
  derivationPath: string;
  onInteractionRequested?: (type: UserInteractionRequested) => void;
}) {
  const { observable } = signer.getAddress(derivationPath);
  return new Promise<{ address: string }>((resolve, reject) =>
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
            resolve(output);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            reject(error);
            break;
          }
        }
      },
    }),
  );
}

async function getSolanaAddressByDerivationPath({
  signer,
  derivationPath,
  onInteractionRequested,
}: {
  signer: DefaultSignerSolana;
  derivationPath: string;
  onInteractionRequested?: (type: UserInteractionRequested) => void;
}) {
  const { observable } = signer.getAddress(derivationPath);
  return new Promise<{ address: string }>((resolve, reject) =>
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
            resolve({ address: output });
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            reject(error);
            break;
          }
        }
      },
    }),
  );
}

async function getEthAddressByIndex({
  signer,
  type,
  accountIndex,
  onInteractionRequested,
}: {
  signer: DefaultSignerEth;
  type: PathType;
  accountIndex: number;
  onInteractionRequested?: (type: UserInteractionRequested) => void;
}) {
  const derivationPath = getDerivationPath(type, accountIndex);
  const account = await getAddressByDerivationPath({
    signer,
    derivationPath,
    onInteractionRequested,
  });

  return { derivationPath, account };
}

async function getSolanaAddressByIndex({
  signer,
  type,
  accountIndex,
  onInteractionRequested,
}: {
  signer: DefaultSignerSolana;
  type: PathType;
  accountIndex: number;
  onInteractionRequested?: (type: UserInteractionRequested) => void;
}) {
  const derivationPath = getDerivationPath(type, accountIndex);
  const account = await getSolanaAddressByDerivationPath({
    signer,
    derivationPath,
    onInteractionRequested,
  });

  return { derivationPath, account };
}

function asyncQueue({
  numberOfIterations,
  asyncFn,
}: {
  numberOfIterations: number;
  asyncFn: (index: number) => Promise<any>;
}) {
  return new Promise<void>((resolve, reject) => {
    let index = 0;
    function invoke() {
      asyncFn(index++)
        .then(() => {
          if (index < numberOfIterations) {
            invoke();
          } else {
            resolve();
          }
        })
        .catch(reject);
    }
    invoke();
  });
}

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export async function getAddressesEth(
  { type, from = 0, count }: { type: PathType; from?: number; count: number },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  console.log("Getting ETH addresses:", { sessionId, type, from, count });
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const addresses: Array<Awaited<ReturnType<typeof getEthAddressByIndex>>> = [];
  await asyncQueue({
    numberOfIterations: count,
    asyncFn: async index => {
      const addressData = await getEthAddressByIndex({
        signer: ethereumAppInstance,
        type,
        accountIndex: from + index,
        onInteractionRequested,
      });
      console.log("Got address data:", addressData);
      addresses.push(addressData);
    },
  });
  return addresses;
}

export async function getAddressesSolana(
  { type, from = 0, count }: { type: PathType; from?: number; count: number },
  {
    sessionId,
    onInteractionRequested,
  }: {
    sessionId: string;
    onInteractionRequested?: (type: UserInteractionRequested) => void;
  },
) {
  const solanaAppInstance = new SignerSolanaBuilder({ dmk, sessionId }).build();
  const addresses: Array<Awaited<ReturnType<typeof getSolanaAddressByIndex>>> =
    [];
  await asyncQueue({
    numberOfIterations: count,
    asyncFn: async index => {
      const addressData = await getSolanaAddressByIndex({
        signer: solanaAppInstance,
        type,
        accountIndex: from + index,
        onInteractionRequested,
      });
      addresses.push(addressData);
    },
  });
  return addresses;
}
