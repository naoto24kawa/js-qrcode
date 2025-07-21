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

export const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export const MAX_DATA_LENGTH = 2900;

export const VERSION_INFO = {
  MIN_VERSION: 1,
  MAX_VERSION: 40,
  SUPPORTED_MAX: 15  // Current supported maximum QR code version
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
  size: 600,  // Larger size optimized for smartphone scanning
  margin: 8,  // Larger quiet zone optimized for smartphone scanning
  errorCorrectionLevel: 'M',  // Default error correction level
  color: { dark: '#000000', light: '#FFFFFF' },
  format: 'svg',  // 'svg' or 'png'
  // forceMask: undefined,  // 0-7 to force specific mask pattern
  // legacyCompatibility: false  // true for legacy reader compatibility
};

export const CAPACITY_TABLE = {
  // ISO/IEC 18004 compliant capacity table [Numeric, Alphanumeric, Binary, Kanji]
  1: { L: [41, 25, 17, 10], M: [34, 20, 14, 8], Q: [27, 16, 11, 7], H: [17, 10, 7, 4] },
  2: { L: [77, 47, 32, 20], M: [63, 38, 26, 16], Q: [48, 29, 20, 12], H: [34, 20, 14, 8] },
  3: { L: [127, 77, 53, 32], M: [101, 61, 42, 26], Q: [77, 47, 32, 20], H: [58, 35, 24, 15] },
  4: { L: [187, 114, 78, 48], M: [149, 90, 62, 38], Q: [111, 67, 46, 28], H: [82, 50, 34, 21] },
  5: { L: [255, 154, 106, 65], M: [202, 122, 84, 52], Q: [144, 87, 60, 37], H: [106, 64, 44, 27] },
  6: { L: [322, 195, 134, 82], M: [255, 154, 106, 65], Q: [178, 108, 74, 45], H: [139, 84, 58, 36] },
  7: { L: [370, 224, 154, 95], M: [293, 178, 122, 75], Q: [207, 125, 86, 53], H: [154, 93, 64, 39] },
  8: { L: [461, 279, 192, 118], M: [365, 221, 152, 93], Q: [259, 157, 108, 66], H: [202, 122, 84, 52] },
  9: { L: [552, 335, 230, 141], M: [432, 262, 180, 111], Q: [312, 189, 130, 80], H: [235, 143, 98, 60] },
  10: { L: [652, 395, 271, 167], M: [513, 311, 213, 131], Q: [364, 221, 151, 93], H: [288, 174, 119, 74] },
  11: { L: [772, 468, 321, 198], M: [604, 366, 251, 155], Q: [427, 259, 177, 109], H: [331, 200, 137, 85] },
  12: { L: [883, 535, 367, 226], M: [691, 419, 287, 177], Q: [489, 296, 203, 125], H: [374, 227, 155, 96] },
  13: { L: [1022, 619, 425, 262], M: [796, 483, 331, 204], Q: [580, 352, 241, 149], H: [427, 259, 177, 109] },
  14: { L: [1101, 667, 458, 282], M: [871, 528, 362, 223], Q: [621, 376, 258, 159], H: [468, 283, 194, 120] },
  15: { L: [1250, 758, 520, 320], M: [991, 600, 412, 254], Q: [703, 426, 292, 180], H: [530, 321, 220, 136] }
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