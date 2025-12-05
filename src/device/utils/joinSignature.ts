export function joinSignature(result: { v: number; s: string; r: string }) {
  // Ensure r and s are 64 characters (32 bytes) without 0x prefix
  const r = result.r.replace("0x", "").padStart(64, "0");
  const s = result.s.replace("0x", "").padStart(64, "0");

  // Convert v to hex (2 characters)
  const v = result.v.toString(16).padStart(2, "0");
  return `0x${r}${s}${v}`;
}
