import { ethers } from "ethers";
import { dmk } from "../device/connectDevice";
import {
  SignerEthBuilder,
  TypedData,
} from "@ledgerhq/device-signer-kit-ethereum";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";

export async function personalSign(
  derivationPath: string,
  message: string,
  sessionId: string,
) {
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const { observable } = ethereumAppInstance.signMessage(
    derivationPath,
    message,
  );
  console.log("About to sign message:", message);
  return new Promise<string>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The signing action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            // Access the intermediate value here, explained below
            console.log(
              "The signing action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The signing action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
            resolve(ethers.Signature.from(output).serialized);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            // Access the error here if occurred
            console.log("An error occurred during the signing action: ", error);
            // reject(error);
            break;
          }
        }
      },
    });
  });
}

export async function signTypedData_v4(
  derivationPath: string,
  rawTypedData: string | TypedData,
  sessionId: string,
) {
  const ethereumAppInstance = new SignerEthBuilder({ dmk, sessionId }).build();
  const typedData =
    typeof rawTypedData === "string" ? JSON.parse(rawTypedData) : rawTypedData;
  const { observable } = ethereumAppInstance.signTypedData(
    derivationPath,
    typedData,
  );
  return new Promise<string>((resolve, reject) => {
    observable.subscribe({
      next: state => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted: {
            console.log("The signing action is not started yet.");
            break;
          }
          case DeviceActionStatus.Pending: {
            const {
              intermediateValue: { requiredUserInteraction },
            } = state;
            // Access the intermediate value here, explained below
            console.log(
              "The signing action is pending and the intermediate value is: ",
              requiredUserInteraction,
            );
            break;
          }
          case DeviceActionStatus.Stopped: {
            console.log("The signing action has been stopped.");
            break;
          }
          case DeviceActionStatus.Completed: {
            const { output } = state;
            // Access the output of the completed action here
            console.log("The signing action has been completed: ", output);
            // Convert { r, s, v } to standard Ethereum signature format
            resolve(ethers.Signature.from(output).serialized);
            break;
          }
          case DeviceActionStatus.Error: {
            const { error } = state;
            // Access the error here if occurred
            console.log("An error occurred during the signing action: ", error);
            reject(error);
            break;
          }
        }
      },
    });
  });
}
