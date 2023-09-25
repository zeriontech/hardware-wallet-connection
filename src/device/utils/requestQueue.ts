/**
 * TODO:
 * Currently the idea is to use `enqueueCall` for all async calls to
 * a ledger device. It works, but it's easy to forget. So it might be a better
 * idea to create an `AppEth` proxy in all places where we currently
 * create `new AppEth(transport)`. That proxy would be responsible for sending
 * all requests through a queue.
 */
interface QueueItem {
  call: () => Promise<any>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}
const queue: Array<QueueItem> = [];
const activeCalls = new Set<QueueItem>();

function check() {
  if (process.env.NODE_ENV === "development") {
    if (activeCalls.size > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        "Invariant: there should be no more that one active call; found:",
        activeCalls.size
      );
    }
  }
}

function takeNext() {
  check();
  if (queue.length === 0 || activeCalls.size !== 0) {
    return;
  }
  const activeCall = queue.shift();
  if (!activeCall) {
    return;
  }
  activeCalls.add(activeCall);
  const { call, resolve, reject } = activeCall;
  call().then(
    (result) => {
      check();
      activeCalls.delete(activeCall);
      resolve(result);
      takeNext();
    },
    (error) => {
      check();
      activeCalls.delete(activeCall);
      reject(error);
      takeNext();
    }
  );
}

export function enqueueCall<T>(call: () => Promise<T>): Promise<T> {
  check();
  const promise = new Promise<T>((resolve, reject) => {
    queue.push({
      call,
      resolve: (value: unknown) => resolve(value as T),
      reject,
    });
    if (queue.length === 1) {
      takeNext();
    }
  });
  return promise;
}
