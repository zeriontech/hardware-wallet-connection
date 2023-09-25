# Ledger

## Async calls to the device are blocking
If a call to a device is in progress (e.g. to get an address or to
  open a connection), you cannot make another call to the device or it will be
  blocked. So currently the idea is to always use a global *queue* for such
  requests. Implementation of such queue can be found
  at `./device/requestQueue.js`;


## Derivation paths
To get addresses that exist on a ledger device,
a `appEth.getAddress(derivationPath: string)` method is used
(from a `'@ledgerhq/hw-app-eth'` lib).

"Derivation paths" are described here: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

For ledger, there are two commonly used derivation path schemes:
"legacy" and "ledger live".

* Derivation paths for ledger:
  ```
  acc1: 44'/60'/0'/0,
  acc2: 44'/60'/0'/1,
  acc3: 44'/60'/0'/2,
  acc4: 44'/60'/0'/3
  .....
  ```

* Derivation paths for ledger live:
  ```
  acc1: 44'/60'/0'/0/0
  acc2: 44'/60'/1'/0/0
  acc3: 44'/60'/2'/0/0
  acc4: 44'/60'/3'/0/0
  .....
  ```


## Checking if ledger wallet is active
Right now, we decided to assume that a ledger wallet is always "active".
When we want to send transactions from it, we always restart the connection
flow.

If we decide later that we want to check whether the physical wallet is
connected, we would have code that looks something like this:

```
try {
  // first, check is device is connected
  const {appEth} = await checkDevice();

  // then, check if saved ledger addresses exist on the connected device
  await ledgerWallets.reduce((promise, wallet) => {
    return promise.then(() => {
      const {derivationPath} = wallet.meta;
      return getAddressByDerivationPath(appEth, {derivationPath});
    }).then(({account}) => {
      if (wallet.address === account.address.toLowerCase()) {
        activeLedgerAddresses.push(wallet.address);
      }
    });
  }, Promise.resolve());
}
catch {
  // if ledger device is not connected or an address is not
  // found on device, it's considered "not active"
  //
  // Do nothing.
}
```

Keep in mind that too many requests to the device can make it laggy. So it's
not a good idea to poll it too often.
