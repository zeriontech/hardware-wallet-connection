import { TransportIdentifier } from "@ledgerhq/device-management-kit";
// import { enqueueCall } from "./utils/requestQueue";
// import { emitter } from "../events";
// import { ConnectError } from "./errors";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
// import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
// import { SignerSolanaBuilder } from "@ledgerhq/device-signer-kit-solana";
import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
// import { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";
// import { DefaultSignerSolana } from "@ledgerhq/device-signer-kit-solana/internal/DefaultSignerSolana.js";

export const webBleIdentifier: TransportIdentifier = "WEB-BLE-RN-STYLE";
export const webHidIdentifier: TransportIdentifier = "WEB-HID";

export const dmk = new DeviceManagementKitBuilder()
  .addLogger(new ConsoleLogger())
  .addTransport(webHidTransportFactory)
  .addTransport(webBleTransportFactory)
  .build();

// async function ensureEthereumAppIsRunning(appEth: AppEth) {
//   try {
//     /**
//      * Calling appEth.getAppConfiguration() is a way to check if the
//      * Etherium app is opened on the ledger device. If it's not opened,
//      * this method will throw.
//      */
//     const { version } = await enqueueCall(() => appEth.getAppConfiguration());
//     console.log({ version }); // eslint-disable-line
//     return { version };
//   } catch (error) {
//     emitter.emit("error", { error });
//     throw error;
//   }
// }

// let sessionId: string | null = null;

// function getSessionId() {
//   return sessionId;
//   // return sessionStorage.getItem("dmkSessionId");
// }

// function setSessionId(id: string) {
//   sessionId = id;
//   // sessionStorage.setItem("dmkSessionId", id);
// }

// export let signerEth: DefaultSignerEth | null = null;
// export let signerSol: DefaultSignerSolana | null = null;

// function initSigners() {
//   const sessionId = getSessionId();
//   if (sessionId == null) {
//     throw new Error("No active session");
//   }
//   if (!signerEth) {
//     signerEth = new SignerEthBuilder({ dmk, sessionId }).build();
//   }
//   if (!signerSol) {
//     signerSol = new SignerSolanaBuilder({ dmk, sessionId }).build();
//   }
// }

export async function connectDevice({
  transportIdentifier,
}: {
  transportIdentifier: TransportIdentifier;
}) {
  return await new Promise<{
    sessionId: string;
    device: DiscoveredDevice;
  }>((resolve, reject) => {
    console.log("Connecting to device...");
    dmk.startDiscovering({ transport: transportIdentifier }).subscribe({
      next: device => {
        dmk
          .connect({
            device,
          })
          .then(sId => {
            console.log("Device connected with session ID:", sId);
            // setSessionId(sId);
            // initSigners();
            // if (!signerEth) {
            //   throw new Error("Ethereum signer is not initialized");
            // }
            // if (!signerSol) {
            //   throw new Error("Solana signer is not initialized");
            // }
            // monitorDeviceState(sId);
            // console.log("Device is ready to use.", {
            //   device,
            //   sessionId: sId,
            //   signerEth,
            //   signerSol,
            // });
            resolve({ sessionId: sId, device });
          });
      },
      error: error => {
        console.error(error);
        reject(error);
      },
    });
  });
}
// try {
//   const transport = await enqueueCall(() => TransportWebUSB.create());
//   const appEth = new AppEth(transport);
//   const { version } = await ensureEthereumAppIsRunning(appEth);
//   return { appEth, transport, appVersion: version };
// } catch (error) {
//   emitter.emit("error", { error });
//   throw error;
// }
// }

export async function checkDevice({
  transportIdentifier,
}: {
  transportIdentifier: TransportIdentifier;
}) {
  console.log("Checking device connection status 2...");
  return new Promise<{
    sessionId: string;
    device: DiscoveredDevice;
  }>((resolve, reject) => {
    dmk
      .listenToAvailableDevices({ transport: transportIdentifier })
      .subscribe(devices => {
        console.log("Web HID devices:", devices);
        if (devices.length > 0) {
          const connectedDevices = dmk.listConnectedDevices();
          const alreadyConnected = connectedDevices.find(
            d => d.id === devices[0].id,
          );
          if (alreadyConnected) {
            resolve({
              sessionId: alreadyConnected.sessionId,
              device: devices[0],
            });
          }
          dmk.connect({ device: devices[0] }).then(sId => {
            console.log("Device connected with session ID:", sId);
            // setSessionId(sId);
            // initSigners();
            // if (!signerEth) {
            //   throw new Error("Ethereum signer is not initialized");
            // }
            // if (!signerSol) {
            //   throw new Error("Solana signer is not initialized");
            // }
            // console.log("Device is ready to use.", {
            //   sessionId: sId,
            //   signerEth,
            //   signerSol,
            // });
            resolve({
              sessionId: sId,
              device: devices[0],
            });
          });
        }
      });
    // const sessionId = getSessionId();
    // if (!sessionId) {
    //   reject(new Error("No active session"));
    //   return;
    // }
    // dmk.getDeviceSessionState({ sessionId }).subscribe({
    //   next: state => {
    //     console.log("Device session state:", state);
    //     if (state.deviceStatus === DeviceStatus.CONNECTED && signerEth) {
    //       resolve({ appEth: signerEth });
    //     }
    //     reject(new Error("Device not connected"));
    //   },
    //   error: error => {
    //     console.error("Error getting device session state:", error);
    //     reject(error);
    //   },
    // });
  });

  // /**
  //  * This function checks if the device is connected
  //  * without ever displaying device permission window.
  //  * This check may be safely performed in background.
  //  */
  // try {
  //   const transport = await enqueueCall(() => TransportWebUSB.openConnected());
  //   if (!transport) {
  //     throw new ConnectError("disconnected");
  //   }
  //   const appEth = new AppEth(transport);
  //   const { version } = await ensureEthereumAppIsRunning(appEth);
  //   return { appEth, transport, appVersion: version };
  // } catch (error) {
  //   emitter.emit("error", { error });
  //   throw error;
  // }
}

// export async function safelyCheckDevice() {
//   try {
//     return await checkDevice();
//   } catch (error) {
//     console.log("Device check failed, attempting to reconnect...", error);
//     return await connectDevice();
//   }
// }
