import { 
  QR_MODES, 
  ALPHANUMERIC_CHARS, 
  CHARACTER_COUNT_LENGTHS,
  NUMERIC_ENCODING,
  ALPHANUMERIC_ENCODING 
} from './constants.js';

export class QRDataEncoderCore {
  constructor() {
    this.textEncoder = new TextEncoder();
  }

  encode(data, mode, version) {
    let bits = this.padBinaryString(mode.toString(2), 4);
    
    const lengthBits = this.getCharacterCountLength(mode, version);
    
    let dataLength = data.length;
    if (mode === QR_MODES.BYTE) {
      dataLength = this.stringToUtf8Bytes(data).length;
    }
    
    bits += this.padBinaryString(dataLength.toString(2), lengthBits);
    bits += this.encodeByMode(data, mode);
    
    return bits;
  }

  getCharacterCountLength(mode, version) {
    if (mode === QR_MODES.NUMERIC) {
      return version <= 9 ? CHARACTER_COUNT_LENGTHS.NUMERIC.SMALL.bits :
             version <= 26 ? CHARACTER_COUNT_LENGTHS.NUMERIC.MEDIUM.bits :
             CHARACTER_COUNT_LENGTHS.NUMERIC.LARGE.bits;
    } else if (mode === QR_MODES.ALPHANUMERIC) {
      return version <= 9 ? CHARACTER_COUNT_LENGTHS.ALPHANUMERIC.SMALL.bits :
             version <= 26 ? CHARACTER_COUNT_LENGTHS.ALPHANUMERIC.MEDIUM.bits :
             CHARACTER_COUNT_LENGTHS.ALPHANUMERIC.LARGE.bits;
    }
    return version <= 9 ? CHARACTER_COUNT_LENGTHS.BYTE.SMALL.bits :
           CHARACTER_COUNT_LENGTHS.BYTE.LARGE.bits;
  }

  encodeByMode(data, mode) {
    switch (mode) {
      case QR_MODES.NUMERIC:
        return this.encodeNumeric(data);
      case QR_MODES.ALPHANUMERIC:
        return this.encodeAlphanumeric(data);
      default:
        return this.encodeByte(data);
    }
  }

  encodeNumeric(data) {
    let bits = '';
    for (let i = 0; i < data.length; i += 3) {
      const group = data.slice(i, i + 3);
      const value = parseInt(group, 10);
      const bitLength = this.getNumericBitLength(group.length);
      bits += this.padBinaryString(value.toString(2), bitLength);
    }
    return bits;
  }

  getNumericBitLength(digitCount) {
    switch (digitCount) {
      case 3: return NUMERIC_ENCODING.THREE_DIGITS;
      case 2: return NUMERIC_ENCODING.TWO_DIGITS;
      default: return NUMERIC_ENCODING.ONE_DIGIT;
    }
  }

  encodeAlphanumeric(data) {
    let bits = '';
    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        const val1 = ALPHANUMERIC_CHARS.indexOf(data[i]);
        const val2 = ALPHANUMERIC_CHARS.indexOf(data[i + 1]);
        const value = val1 * ALPHANUMERIC_ENCODING.MULTIPLIER + val2;
        bits += this.padBinaryString(value.toString(2), ALPHANUMERIC_ENCODING.PAIR_BITS);
      } else {
        const value = ALPHANUMERIC_CHARS.indexOf(data[i]);
        bits += this.padBinaryString(value.toString(2), ALPHANUMERIC_ENCODING.SINGLE_BITS);
      }
    }
    return bits;
  }

  encodeByte(data) {
    const utf8Bytes = this.stringToUtf8Bytes(data);
    let bits = '';
    
    for (const byte of utf8Bytes) {
      bits += this.padBinaryString(byte.toString(2), 8);
    }
    return bits;
  }

  stringToUtf8Bytes(str) {
    return Array.from(this.textEncoder.encode(str));
  }

  padBinaryString(str, length) {
    return str.padStart(length, '0');
  }
}