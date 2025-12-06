function supportsWebUsb() {
  return "usb" in navigator;
}

export function supportsBluetooth() {
  return "bluetooth" in navigator;
}

export function supportsLedger() {
  return supportsWebUsb();
}
