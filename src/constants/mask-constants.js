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

// Legacy compatibility mask settings
export const LEGACY_COMPATIBLE_MASKS = {
  'L': 4,
  'M': 4,
  'Q': 3,
  'H': 1
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