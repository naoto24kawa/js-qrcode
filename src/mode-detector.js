import { QR_MODES, ALPHANUMERIC_CHARS } from './constants/index.js';
import { getModeIndex } from './utils/mode-utils.js';

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
    return getModeIndex(mode);
  }
}