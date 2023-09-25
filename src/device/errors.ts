type LedgerError = Error & { statusCode?: number };

export function interpretError(error: LedgerError) {
  const messages = {
    TransportError: () =>
      "Connection error. Try reconnecting your ledger device",
    TransportOpenUserCancelled: (e: LedgerError) => e.message,
    TransportInterfaceNotAvailable: () =>
      "Device not available. If your device is currently being used by another app, try disconnecting it from that app",
    TransportStatusError: (e: LedgerError) => {
      if (e.statusCode === 27904) {
        return (
          "Please make sure that your ledger device is unlocked " +
          "and Ethereum app is running"
        );
      }
      return "Please make sure Ethereum app is running on the device";
    },
  };
  if (error.name in messages) {
    return messages[error.name as keyof typeof messages](error);
  }
  return String(error);
}

export function deniedByUser(error: LedgerError) {
  return error.statusCode === 27013;
}
