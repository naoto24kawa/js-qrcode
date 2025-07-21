export const DEFAULT_OPTIONS = {
  size: 600,  // Larger size optimized for smartphone scanning
  margin: 8,  // Larger quiet zone optimized for smartphone scanning
  errorCorrectionLevel: 'M',  // Default error correction level
  color: { dark: '#000000', light: '#FFFFFF' },
  format: 'svg',  // 'svg' or 'png'
  // forceMask: undefined,  // 0-7 to force specific mask pattern
  // legacyCompatibility: false  // true for legacy reader compatibility
};

// Module builder constants
export const MODULE_BUILDER_CONSTANTS = {
  DIRECTION_UP: -1,
  DIRECTION_DOWN: 1,
  TIMING_POSITION: 6,
  COLUMN_STEP: 2
};