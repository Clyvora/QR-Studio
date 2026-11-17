/**
 * Error thrown by QRCODE for invalid input or options.
 * `code` is a stable, machine-readable identifier (e.g. "DATA_TOO_LONG").
 */
export class QRCODEError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "QRCODEError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}
