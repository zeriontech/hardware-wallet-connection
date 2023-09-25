export function decodeMessageSign(result: { v: number; s: string; r: string }) {
  let v = (result.v - 27).toString(16);
  if (v.length < 2) {
    v = `0${v}`;
  }
  return `0x${result.r}${result.s}${v}`;
}
