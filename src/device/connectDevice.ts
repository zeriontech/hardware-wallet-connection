import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import AppEth from "@ledgerhq/hw-app-eth";
import { enqueueCall } from "./utils/requestQueue";
import { emitter } from "../events";
import { ConnectError } from "./errors";

async function ensureEthereumAppIsRunning(appEth: AppEth) {
  try {
    /**
     * Calling appEth.getAppConfiguration() is a way to check if the
     * Etherium app is opened on the ledger device. If it's not opened,
     * this method will throw.
     */
    const { version } = await enqueueCall(() => appEth.getAppConfiguration());
    console.log({ version }); // eslint-disable-line
    return { version };
  } catch (error) {
    emitter.emit("error", { error });
    throw error;
  }
}

export async function connectDevice() {
  try {
    const transport = await enqueueCall(() => TransportWebUSB.create());
    const appEth = new AppEth(transport);
    const { version } = await ensureEthereumAppIsRunning(appEth);
    return { appEth, transport, appVersion: version };
  } catch (error) {
    emitter.emit("error", { error });
    throw error;
  }
}

export async function checkDevice() {
  /**
   * This function checks if the device is connected
   * without ever displaying device permission window.
   * This check may be safely performed in background.
   */
  try {
    const transport = await enqueueCall(() => TransportWebUSB.openConnected());
    if (!transport) {
      throw new ConnectError("disconnected");
    }
    const appEth = new AppEth(transport);
    const { version } = await ensureEthereumAppIsRunning(appEth);
    return { appEth, transport, appVersion: version };
  } catch (error) {
    emitter.emit("error", { error });
    throw error;
  }
}
