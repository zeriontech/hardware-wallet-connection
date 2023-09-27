import { serializeTransaction } from "./signTransaction";

export const sample1 = {
  derivationPath: "44'/60'/0'/0/0",
  tx: {
    from: "0x99ef6bf06ad80679512a2541cea90fa20dbcae0f",
    to: "0x8c56a34129dcf0711fe57e47fdcb733fce40a29f",
    value: "0xaa87bee538000",
    chainId: "0x1",
    data: "0x",
    gas: "23100",
    maxFeePerGas: "0x786fcd818",
    maxPriorityFeePerGas: "0xdac78fe8",
    nonce: 14,
    gasLimit: "23100",
  },
  serializeResult:
    "02ef010e84dac78fe8850786fcd818825a3c948c56a34129dcf0711fe57e47fdcb733fce40a29f870aa87bee53800080c0",
  signedAndSerialized:
    "0x02f872010e84dac78fe8850786fcd818825a3c948c56a34129dcf0711fe57e47fdcb733fce40a29f870aa87bee53800080c001a02ce9bd73044c7e476c62d950d6e3d9bae65593c1eb269982f67e9d3c3f8a0684a028527e94fa6583ddccce87294c8a1ce01ba9f2dec87b9bc24074c6a3fa59c5af",
};

export async function test() {
  const sample = {
    from: "0x99ef6bf06ad80679512a2541cea90fa20dbcae0f",
    to: "0x8c56a34129dcf0711fe57e47fdcb733fce40a29f",
    value: "0xaa87bee538000",
    chainId: "0x1",
    data: "0x",
    gas: "23100",
    maxFeePerGas: "0x92b296d41",
    maxPriorityFeePerGas: "0x9c3bb6bf",
    nonce: 14,
    gasLimit: "23100",
  };

  const expected =
    "02ef010e849c3bb6bf85092b296d41825a3c948c56a34129dcf0711fe57e47fdcb733fce40a29f870aa87bee53800080c0";

  const result = await serializeTransaction(sample);
  console.log({ result, expected });

  console.log("testing");
  console.assert(result === expected);
}
