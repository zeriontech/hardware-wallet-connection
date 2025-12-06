import { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { DefaultSignerSolana } from "@ledgerhq/device-signer-kit-solana/internal/DefaultSignerSolana.js";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { dmk } from "./connectDevice";
import { SignerSolanaBuilder } from "@ledgerhq/device-signer-kit-solana";

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

async function getAddressByDerivationPath(
  appEth: DefaultSignerEth,
  { derivationPath }: { derivationPath: string },
) {
  console.log("Getting address for derivation path:", derivationPath);
  const { observable } = appEth.getAddress(derivationPath);
  return new Promise<{ address: string }>((resolve, reject) =>
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            // Access the intermediate value here, explained below
            console.log(
              "The action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The action has been completed: ", output);
            resolve(output);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            // Access the error here if occurred
            console.log("An error occurred during the action: ", error);
            reject(error);
            break;
          }
        }
      },
    }),
  );
}

async function getSolanaAddressByDerivationPath(
  appSol: DefaultSignerSolana,
  { derivationPath }: { derivationPath: string },
) {
  const { observable } = appSol.getAddress(derivationPath);
  return new Promise<{ address: string }>((resolve, reject) =>
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            console.log(
              "The action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            console.log("The action has been completed: ", output);
            resolve({ address: output });
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            console.log("An error occurred during the action: ", error);
            reject(error);
            break;
          }
        }
      },
    }),
  );
}

async function getEthAddressByIndex(
  appEth: DefaultSignerEth,
  { type, accountIndex }: { type: PathType; accountIndex: number },
) {
  const derivationPath = getDerivationPath(type, accountIndex);
  const account = await getAddressByDerivationPath(appEth, {
    derivationPath,
  });

  return { derivationPath, account };
}

async function getSolanaAddressByIndex(
  appSol: DefaultSignerSolana,
  { type, accountIndex }: { type: PathType; accountIndex: number },
) {
  const derivationPath = getDerivationPath(type, accountIndex);
  const account = await getSolanaAddressByDerivationPath(appSol, {
    derivationPath,
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
  sessionId: string,
  { type, from, count }: { type: PathType; from: number; count: number },
) {
  /**
   * Returns a list of addresses in "bulk".
   * Addresses are requested by their "index" (first, second, ...)
   */
  console.log("Getting ETH addresses:", { sessionId, type, from, count });
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const addresses: Array<Awaited<ReturnType<typeof getEthAddressByIndex>>> = [];
  await asyncQueue({
    numberOfIterations: count,
    asyncFn: async index => {
      const addressData = await getEthAddressByIndex(ethereumAppInstance, {
        type,
        accountIndex: from + index,
      });
      console.log("Got address data:", addressData);
      addresses.push(addressData);
    },
  });
  return addresses;
}

export async function getAddressesSolana(
  sessionId: string,
  { type, from, count }: { type: PathType; from: number; count: number },
) {
  const solanaAppInstance = new SignerSolanaBuilder({ dmk, sessionId }).build();
  const addresses: Array<Awaited<ReturnType<typeof getSolanaAddressByIndex>>> =
    [];
  await asyncQueue({
    numberOfIterations: count,
    asyncFn: async index => {
      const addressData = await getSolanaAddressByIndex(solanaAppInstance, {
        type,
        accountIndex: from + index,
      });
      addresses.push(addressData);
    },
  });
  return addresses;
}
