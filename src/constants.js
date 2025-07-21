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

// Module builder constants
export const MODULE_BUILDER_CONSTANTS = {
  DIRECTION_UP: -1,
  DIRECTION_DOWN: 1,
  TIMING_POSITION: 6,
  COLUMN_STEP: 2
};

export const PATTERN_SIZES = {
  FINDER: 7,
  ALIGNMENT: 5,
  TIMING: 1,
  FINDER_BOUNDARY_SIZE: 8  // Finder pattern + separator boundary
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

// Legacy compatibility mask settings
export const LEGACY_COMPATIBLE_MASKS = {
  'L': 4,
  'M': 4,
  'Q': 3,
  'H': 1
};

// Alignment pattern center positions for each QR code version
// QR Code specification alignment pattern positions (ISO/IEC 18004)
export const ALIGNMENT_PATTERN_TABLE = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],  // バージョン4: 33x33サイズ、アライメント位置 (6,26), (26,6), (26,26)
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70]
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

// QR Code encoding constants
export const QR_PADDING_BYTES = [0xEC, 0x11]; // 11101100, 00010001
export const TERMINATOR_MAX_BITS = 4;
export const AVERAGE_CHARS_PER_VERSION = 30;

// Pattern builder constants
export const PATTERN_BUILDER_CONSTANTS = {
  FINDER_PATTERN_SIZE: 7,
  SEPARATOR_WIDTH: 8,
  TIMING_START: 8,
  DARK_MODULE_FORMULA_BASE: 4,
  DARK_MODULE_FORMULA_OFFSET: 9,
  FORMAT_INFO_LENGTH: 21,
  ALIGNMENT_PATTERN_RADIUS: 2,
  ALIGNMENT_PATTERN_TOTAL_SIZE: 5
};

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

// Data capacity table (data codewords count)
export const DATA_CODEWORDS_COUNT = {
  1: { L: 19, M: 16, Q: 13, H: 9 },
  2: { L: 34, M: 28, Q: 22, H: 16 },
  3: { L: 55, M: 44, Q: 34, H: 26 },
  4: { L: 80, M: 64, Q: 48, H: 36 },
  5: { L: 108, M: 86, Q: 62, H: 46 },
  6: { L: 136, M: 108, Q: 72, H: 54 },
  7: { L: 156, M: 124, Q: 88, H: 66 },
  8: { L: 194, M: 154, Q: 110, H: 84 },
  9: { L: 232, M: 182, Q: 132, H: 102 },
  10: { L: 346, M: 274, Q: 182, H: 132 },
  11: { L: 384, M: 304, Q: 216, H: 168 },
  12: { L: 432, M: 342, Q: 254, H: 196 },
  13: { L: 480, M: 384, Q: 288, H: 224 },
  14: { L: 532, M: 422, Q: 326, H: 254 },
  15: { L: 588, M: 466, Q: 360, H: 280 }
};

// Mask evaluation penalty constants
export const MASK_EVALUATION_PENALTIES = {
  RULE1_BASE_PENALTY: 3,
  RULE1_MIN_CONSECUTIVE: 5,
  RULE2_BLOCK_PENALTY: 3,
  RULE3_FINDER_PATTERN_PENALTY: 40,
  RULE3_PATTERN_LENGTH: 7,
  RULE3_LIGHT_PADDING: 4,
  RULE4_PENALTY_STEP: 10,
  RULE4_DEVIATION_STEP: 5,
  OPTIMAL_DARK_PERCENTAGE: 50
};

// Format information patterns for QR Code specification
export const FORMAT_INFO_PATTERNS = {
  'L': {  // Low error correction (ECL=01)
    row8: [1,1,0,0,1,1,1,0,0,0,0,0,1,0,0,1,0,1,1,1,1],
    col8: [1,1,1,1,0,1,1,0,0,0,0,0,0,1,0,1,1,0,0,1,1]
  },
  'M': {  // Medium error correction (ECL=00)
    row8: [1,0,0,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1],
    col8: [1,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,0,1]
  },
  'Q': {  // Quartile error correction (ECL=11)
    row8: [0,1,1,1,0,1,1,0,0,1,0,1,0,0,0,0,0,0,1,1,0],
    col8: [0,1,1,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,1,1,0]
  },
  'H': {  // High error correction (ECL=10)
    row8: [0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    col8: [1,0,1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,0,0]
  }
};