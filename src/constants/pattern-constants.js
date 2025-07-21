export const PATTERN_SIZES = {
  FINDER: 7,
  ALIGNMENT: 5,
  TIMING: 1,
  FINDER_BOUNDARY_SIZE: 8  // Finder pattern + separator boundary
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

// Alignment pattern center positions for each QR code version
// QR Code specification alignment pattern positions (ISO/IEC 18004)
export const ALIGNMENT_PATTERN_TABLE = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],  // Version 4: 33x33 size, alignment positions (6,26), (26,6), (26,26)
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