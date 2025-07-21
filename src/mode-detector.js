import { QR_MODES, ALPHANUMERIC_CHARS } from './constants.js';

export class QRModeDetector {
  detectMode(data) {
    if (/^[0-9]+$/.test(data)) {
      return QR_MODES.NUMERIC;
    } else if (this.isAlphanumeric(data)) {
      return QR_MODES.ALPHANUMERIC;
    }
    return QR_MODES.BYTE;
  }

  isAlphanumeric(data) {
    return [...data].every(char => ALPHANUMERIC_CHARS.includes(char));
  }

  getModeIndex(mode) {
    switch (mode) {
      case QR_MODES.NUMERIC: return 0;
      case QR_MODES.ALPHANUMERIC: return 1;
      case QR_MODES.BYTE: return 2;
      default: return 2;
    }
  }
}