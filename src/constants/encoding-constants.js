export const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export const MAX_DATA_LENGTH = 2900;

// QR Code encoding constants
export const QR_PADDING_BYTES = [0xEC, 0x11]; // 11101100, 00010001
export const TERMINATOR_MAX_BITS = 4;
export const AVERAGE_CHARS_PER_VERSION = 30;

// Character count indicator lengths
export const CHARACTER_COUNT_LENGTHS = {
  NUMERIC: {
    SMALL: { min: 1, max: 9, bits: 10 },
    MEDIUM: { min: 10, max: 26, bits: 12 },
    LARGE: { min: 27, max: 40, bits: 14 }
  },
  ALPHANUMERIC: {
    SMALL: { min: 1, max: 9, bits: 9 },
    MEDIUM: { min: 10, max: 26, bits: 11 },
    LARGE: { min: 27, max: 40, bits: 13 }
  },
  BYTE: {
    SMALL: { min: 1, max: 9, bits: 8 },
    LARGE: { min: 10, max: 40, bits: 16 }
  }
};

// Numeric encoding bit lengths
export const NUMERIC_ENCODING = {
  THREE_DIGITS: 10,  // 3 digits -> 10 bits
  TWO_DIGITS: 7,     // 2 digits -> 7 bits
  ONE_DIGIT: 4       // 1 digit -> 4 bits
};

// Alphanumeric encoding constants
export const ALPHANUMERIC_ENCODING = {
  MULTIPLIER: 45,     // For pair encoding: val1*45 + val2
  PAIR_BITS: 11,      // Bit length for pair encoding
  SINGLE_BITS: 6      // Bit length for single character
};