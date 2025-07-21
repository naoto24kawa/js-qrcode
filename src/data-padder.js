import { QR_PADDING_BYTES, TERMINATOR_MAX_BITS, DATA_CODEWORDS_COUNT } from './constants.js';

export class QRDataPadder {
  addPadding(bits, version, errorCorrectionLevel) {
    const requiredLength = this.getDataCodewordsCount(version, errorCorrectionLevel);
    
    let paddedBits = this.addTerminator(bits, requiredLength);
    paddedBits = this.padToByteBoundary(paddedBits);
    paddedBits = this.addPaddingBytes(paddedBits, requiredLength);
    
    return this.bitsToBytes(paddedBits.substring(0, requiredLength * 8));
  }

  addTerminator(bits, requiredLength) {
    const terminatorLength = Math.min(TERMINATOR_MAX_BITS, requiredLength * 8 - bits.length);
    return bits + '0'.repeat(terminatorLength);
  }

  padToByteBoundary(bits) {
    while (bits.length % 8 !== 0) {
      bits += '0';
    }
    return bits;
  }

  addPaddingBytes(bits, requiredLength) {
    let paddingIndex = 0;
    
    while (bits.length < requiredLength * 8) {
      const paddingByte = QR_PADDING_BYTES[paddingIndex % 2];
      bits += paddingByte.toString(2).padStart(8, '0');
      paddingIndex++;
    }
    
    return bits;
  }

  bitsToBytes(bits) {
    const bytes = [];
    
    while (bits.length % 8 !== 0) {
      bits += '0';
    }
    
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.substring(i, i + 8), 2);
      bytes.push(byte);
    }
    
    return bytes;
  }

  getDataCodewordsCount(version, errorCorrectionLevel) {
    return DATA_CODEWORDS_COUNT[version]?.[errorCorrectionLevel] || 16;
  }
}