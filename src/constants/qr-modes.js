export const QR_MODES = {
  NUMERIC: 1,
  ALPHANUMERIC: 2,
  BYTE: 4,
  KANJI: 8
};

export const ERROR_CORRECTION_LEVELS = {
  L: 0b01,  // ~7% - QR spec: 01
  M: 0b00,  // ~15% (default) - QR spec: 00
  Q: 0b11,  // ~25% - QR spec: 11
  H: 0b10   // ~30% - QR spec: 10
};