function supportsWebUsb() {
  return 'usb' in navigator;
}

export function supportsLedger() {
  return supportsWebUsb();
}
