import type AppEth from "@ledgerhq/hw-app-eth";
import { enqueueCall } from "./utils/requestQueue";
import { emitter } from "../events";

const paths = {
  ledger: (index: number) => `44'/60'/0'/${index}`,
  ledgerLive: (index: number) => `44'/60'/${index}'/0/0`,
  bip44: (index: number) => `44'/60'/0'/0/${index}`,
};

type PathType = keyof typeof paths;

function getDerivationPath(type: PathType, accountIndex: number) {
  return paths[type](accountIndex);
}

export async function getAddressByDerivationPath(
  appEth: AppEth,
  { derivationPath }: { derivationPath: string }
) {
  try {
    const account = await enqueueCall(() => appEth.getAddress(derivationPath));
    return { derivationPath, account };
  } catch (error) {
    emitter.emit("error", { error });
    throw error;
  }
}

async function getAddressByIndex(
  appEth: AppEth,
  { type, accountIndex }: { type: PathType; accountIndex: number }
) {
  try {
    const derivationPath = getDerivationPath(type, accountIndex);
    const account = await enqueueCall(() => appEth.getAddress(derivationPath));
    return { derivationPath, account };
  } catch (error) {
    emitter.emit("error", { error });
    throw error;
  }
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

export async function getAddresses(
  ethereumAppInstance: AppEth,
  { type, from, count }: { type: PathType; from: number; count: number }
) {
  /**
   * Returns a list of addresses in "bulk".
   * Addresses are requested by their "index" (first, second, ...)
   */
  const addresses: Array<Awaited<ReturnType<typeof getAddressByIndex>>> = [];
  await asyncQueue({
    numberOfIterations: count,
    asyncFn: async (index) => {
      const account = await getAddressByIndex(ethereumAppInstance, {
        type,
        accountIndex: from + index,
      });
      addresses.push(account);
    },
  });
  return addresses;
}
