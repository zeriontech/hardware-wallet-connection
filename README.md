# hardware-wallet-connection

The `hardware-wallet-connection` module is a JavaScript library that provides methods for interacting with a Ledger hardware wallet. You can use it to connect to a Ledger device, check its status, retrieve addresses and sign transactions.

## Installation

You can install `hardware-wallet-connection` via npm or yarn:

```bash
npm install hardware-wallet-connection
# OR
yarn add hardware-wallet-connection
```

## Usage

### Importing the Module

To use the `hardware-wallet-connection` module, import the required methods as follows:

```javascript
import {
  connectDevice,
  checkDevice,
  interpretError,
  deniedByUser,
  getAddressByDerivationPath,
  getAddresses,
  supportsLedger,
  signTransaction,
  serializeTransaction,
} from "hardware-wallet-connection";
```

### Methods

#### `connectDevice()`

Use this method to establish a connection with a Ledger hardware wallet.
For first-time connection, browser will show a Permission Window

```javascript
const device = await connectDevice();
```

#### `checkDevice()`

Check the status of the connected Ledger device.
This function checks if the device is connected without ever displaying device permission window. This check may be safely performed in background.

```javascript
const deviceStatus = await checkDevice();
```

#### `interpretError(error: LedgerError)`

Interpret Ledger error codes to provide more user-friendly error messages.

```javascript
const errorMessage = interpretError(error);
```

#### `deniedByUser(error: LedgerError)`

Check if the user denied a Ledger action.

```javascript
const isDenied = deniedByUser(error);
```

#### `getAddressByDerivationPath(appEth: AppEth, { derivationPath }: { derivationPath: string })`

Retrieve an address from the Ledger device using a specified derivation path.

```javascript
// retrieved address for index: 1
const address = await getAddressByDerivationPath(appEth, {
  derivationPath: "44'/60'/1'/0/0",
});
```

#### `getAddresses(appEth: AppEth, { type, from, count }: { type: PathType; from: number; count: number })`

Retrieve multiple addresses from the Ledger device using an array of derivation paths.

```javascript
const addresses = getAddresses(appEth: AppEth, { type: 'ledgerLive', from: 0, count: 5 });
```

#### `supportsLedger()`

Check if the current environment supports Ledger hardware wallets.

```javascript
const isSupported = supportsLedger();
```

#### `signTransaction(derivationPath: string, transaction: IncomingTransaction)`

Sign a transaction using the Ledger device.

```javascript
const signedTransaction = signTransaction("44'/60'/1'/0/0", transaction);
```

#### `serializeTransaction(transaction: IncomingTransaction)`

Serialize a transaction for Ledger signing.

```javascript
const serializedTransaction = serializeTransaction(transaction);
```

## Author

everdimension <everdimension@gmail.com>

---

**Disclaimer**: This module is not affiliated with or endorsed by Ledger SAS. Use it at your own risk.
