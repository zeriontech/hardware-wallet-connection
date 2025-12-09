import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { parseLedgerError, wait } from "./helpers";

export const transports = {
  bluetooth: "WEB-BLE-RN-STYLE",
  hid: "WEB-HID",
} as const;
export type TransportIdentifier = (typeof transports)[keyof typeof transports];

type DiscoveredDevice = {
  readonly id: string;
  readonly name: string;
  readonly transport: string;
  readonly rssi?: number | null;
};

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
    dmk.startDiscovering({ transport: transportIdentifier }).subscribe({
      next: device => {
        const connectedDevices = dmk.listConnectedDevices();
        const alreadyConnected = connectedDevices.find(d => d.id === device.id);
        if (alreadyConnected) {
          resolve({ sessionId: alreadyConnected.sessionId, device });
        }
        dmk.connect({ device }).then(sId => {
          wait(100).then(() => {
            resolve({ sessionId: sId, device });
          });
        });
      },
      error: error => {
        reject(parseLedgerError(error));
      },
    });
  });
}

export async function checkDevice({
  transportIdentifier,
  deviceId,
}: {
  transportIdentifier: TransportIdentifier;
  deviceId?: string;
}) {
  return new Promise<{
    sessionId: string;
    device: DiscoveredDevice;
  }>(resolve => {
    dmk
      .listenToAvailableDevices({ transport: transportIdentifier })
      .subscribe(devices => {
        if (devices.length > 0) {
          const expectedDeviceId = deviceId || devices[0].id;
          const device = devices.find(d => d.id === expectedDeviceId)!;
          const connectedDevice = dmk
            .listConnectedDevices()
            .find(d => d.id === expectedDeviceId);
          if (connectedDevice) {
            resolve({ sessionId: connectedDevice.sessionId, device });
          }
          dmk.connect({ device }).then(sId => {
            wait(100).then(() => {
              resolve({ sessionId: sId, device });
            });
          });
        }
      });
  });
}
