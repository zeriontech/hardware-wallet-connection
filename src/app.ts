console.log("app");
// import { Buffer } from "buffer";
// globalThis.Buffer = Buffer;
import { connectDevice } from "./index";
console.log({ connectDevice });

document.querySelector("button")?.addEventListener("click", () => {
  connectDevice();
});
