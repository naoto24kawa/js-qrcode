export const QR_MODES = {
  NUMERIC: 1,
  ALPHANUMERIC: 2,
  BYTE: 4,
  KANJI: 8
};

export const ERROR_CORRECTION_LEVELS = {
  L: 1,  // ~7%
  M: 0,  // ~15% (default)
  Q: 3,  // ~25%
  H: 2   // ~30%
};

export const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export const MAX_DATA_LENGTH = 2900;

export const VERSION_INFO = {
  MIN_VERSION: 1,
  MAX_VERSION: 40,
  SUPPORTED_MAX: 10
};

export const MODULE_SIZES = {
  BASE_SIZE: 21,
  VERSION_INCREMENT: 4
};

export const PATTERN_SIZES = {
  FINDER: 7,
  ALIGNMENT: 5,
  TIMING: 1
};

export const DEFAULT_OPTIONS = {
  size: 200,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#FFFFFF' }
};

export const CAPACITY_TABLE = {
  1: { L: [19, 16, 13, 9], M: [16, 14, 11, 8], Q: [13, 11, 9, 5], H: [9, 8, 6, 4] },
  2: { L: [34, 28, 22, 16], M: [28, 22, 18, 14], Q: [22, 18, 14, 10], H: [16, 14, 10, 8] },
  3: { L: [55, 44, 34, 26], M: [44, 35, 27, 21], Q: [34, 27, 21, 15], H: [26, 22, 15, 12] },
  4: { L: [80, 64, 48, 36], M: [64, 50, 38, 30], Q: [48, 38, 29, 21], H: [36, 31, 22, 17] },
  5: { L: [108, 86, 62, 46], M: [86, 68, 49, 38], Q: [62, 49, 37, 26], H: [46, 39, 28, 21] },
  10: { L: [346, 274, 182, 132], M: [274, 216, 154, 119], Q: [182, 154, 113, 80], H: [132, 119, 85, 64] }
};

export const FORMAT_INFO = {
  L: [0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976],
  M: [0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0],
  Q: [0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED],
  H: [0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B]
};

export const FINDER_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1]
];

export const MASK_PATTERNS = [
  (row, col) => (row + col) % 2 === 0,
  (row, _col) => row % 2 === 0,
  (_row, col) => col % 3 === 0,
  (row, col) => (row + col) % 3 === 0,
  (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  (row, col) => ((row * col) % 2) + ((row * col) % 3) === 0,
  (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
  (row, col) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
];