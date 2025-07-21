import { QR_MODES } from '../constants/index.js';

/**
 * Get mode index for capacity table lookup
 */
export function getModeIndex(mode) {
  switch (mode) {
    case QR_MODES.NUMERIC: return 0;
    case QR_MODES.ALPHANUMERIC: return 1;
    case QR_MODES.BYTE: return 2;
    default: return 2;
  }
}