import { QR_MODES, CAPACITY_TABLE, AVERAGE_CHARS_PER_VERSION } from './constants.js';

export class QRVersionSelector {
  constructor() {
    this.textEncoder = new TextEncoder();
  }

  determineVersion(data, mode, errorCorrectionLevel) {
    let length = data.length;
    if (mode === QR_MODES.BYTE) {
      length = this.stringToUtf8Bytes(data).length;
    }
    
    const modeIndex = this.getModeIndex(mode);
    
    for (let version = 1; version <= 15; version++) {
      const capacity = CAPACITY_TABLE[version]?.[errorCorrectionLevel]?.[modeIndex];
      if (capacity && length <= capacity) {
        return version;
      }
    }
    
    return Math.min(15, Math.ceil(length / AVERAGE_CHARS_PER_VERSION));
  }

  getModeIndex(mode) {
    switch (mode) {
      case QR_MODES.NUMERIC: return 0;
      case QR_MODES.ALPHANUMERIC: return 1;
      case QR_MODES.BYTE: return 2;
      default: return 2;
    }
  }

  stringToUtf8Bytes(str) {
    return Array.from(this.textEncoder.encode(str));
  }
}