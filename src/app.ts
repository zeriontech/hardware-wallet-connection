console.log("app");
import { signTransaction } from "./signing/signTransaction";
import { sample1, test } from "./signing/signTransaction.test";

test();

document.querySelector("button")?.addEventListener("click", async () => {
  const result = await signTransaction(sample1.derivationPath, sample1.tx);
  console.log(result);
});
