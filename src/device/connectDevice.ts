import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";

export const transports = {
  bluetooth: "WEB-BLE-RN-STYLE",
  hid: "WEB-HID",
} as const;
export type TransportIdentifier = (typeof transports)[keyof typeof transports];

export const dmk = new DeviceManagementKitBuilder()
  .addLogger(new ConsoleLogger())
  .addTransport(webHidTransportFactory)
  .addTransport(webBleTransportFactory)
  .build();

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
        const connectedDevices = dmk.listConnectedDevices();
        const alreadyConnected = connectedDevices.find(d => d.id === device.id);
        if (alreadyConnected) {
          console.log("Device already connected:", device);
          resolve({
            sessionId: alreadyConnected.sessionId,
            device,
          });
        }
        console.log("Discovered device:", device);
        dmk.connect({ device }).then(sId => {
          console.log("Device connected with session ID:", sId);
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

export async function checkDevice({
  transportIdentifier,
}: {
  transportIdentifier: TransportIdentifier;
}) {
  console.log("Checking device connection status 2...");
  return new Promise<{
    sessionId: string;
    device: DiscoveredDevice;
  }>(resolve => {
    dmk
      .listenToAvailableDevices({ transport: transportIdentifier })
      .subscribe(devices => {
        const connectedDevices = dmk.listConnectedDevices();
        console.log("Web HID devices:", devices, connectedDevices);
        if (devices.length > 0) {
          const alreadyConnected = connectedDevices.find(
            d => d.id === devices[0].id,
          );
          if (alreadyConnected) {
            resolve({
              sessionId: alreadyConnected.sessionId,
              device: devices[0],
            });
          }
          console.log("connecting to device... 123", devices);
          dmk.connect({ device: devices[0] }).then(sId => {
            console.log("Device connected with session ID:", sId);
            resolve({
              sessionId: sId,
              device: devices[0],
            });
          });
        }
      });
  });
}
