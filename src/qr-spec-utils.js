/**
 * QR Code Specification Utilities
 * Common utilities for QR code structure and calculations
 */

export class QRSpecUtils {
  /**
   * Get alignment pattern centers for a given version
   * ISO/IEC 18004:2015 Table 1 - Alignment Pattern Centers
   */
  static getAlignmentPatternCenters(version) {
    const alignmentPatternTable = {
      1: [],
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
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
      15: [6, 26, 48, 70],
      16: [6, 26, 50, 74],
      17: [6, 30, 54, 78],
      18: [6, 30, 56, 82],
      19: [6, 30, 58, 86],
      20: [6, 34, 62, 90]
    };
    
    return alignmentPatternTable[version] || [];
  }

  /**
   * Calculate QR code size for a given version
   * Formula: 21 + (version - 1) * 4
   */
  static calculateQRSize(version) {
    return 21 + (version - 1) * 4;
  }

  /**
   * Check if a module position is reserved (not data)
   * Unified implementation used across multiple classes
   */
  static isReservedModule(row, col, size, version = null) {
    if (row < 0 || row >= size || col < 0 || col >= size) return true;

    // Calculate version if not provided
    if (version === null) {
      version = Math.floor((size - 21) / 4) + 1;
    }
    
    // Finder patterns and separators (9x9 areas)
    if (this.isFinderArea(row, col, size)) {
      return true;
    }
    
    // Timing patterns (row 6 and column 6)
    if (row === 6 || col === 6) {
      return true;
    }
    
    // Dark module (version dependent)
    if (row === 4 * version + 9 && col === 8) {
      return true;
    }
    
    // Format information areas
    if (this.isFormatInfo(row, col, size)) {
      return true;
    }
    
    // Alignment patterns for version 2+
    if (version >= 2 && this.isAlignmentPattern(row, col, version, size)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if position is in finder pattern area
   */
  static isFinderArea(row, col, size) {
    // Finder pattern areas (including separators) - 9x9 areas
    return (row <= 8 && col <= 8) || 
           (row <= 8 && col >= size - 8) || 
           (row >= size - 8 && col <= 8);
  }

  /**
   * Check if position is format information area
   */
  static isFormatInfo(row, col, size) {
    // Upper horizontal format info (row 8, cols 0-8 and size-8 to size-1)
    if (row === 8 && (col <= 8 || col >= size - 8)) {
      return true;
    }
    
    // Left vertical format info (col 8, rows 0-8 and size-7 to size-1)
    if (col === 8 && (row <= 8 || row >= size - 7)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if position is in alignment pattern area
   */
  static isAlignmentPattern(row, col, version, size) {
    if (version < 2) return false;
    
    const centers = this.getAlignmentPatternCenters(version);
    for (const centerRow of centers) {
      for (const centerCol of centers) {
        // Skip if overlaps with finder pattern
        if (this.isFinderArea(centerRow, centerCol, size)) {
          continue;
        }
        
        if (Math.abs(row - centerRow) <= 2 && Math.abs(col - centerCol) <= 2) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get version from QR code size
   */
  static getVersionFromSize(size) {
    return Math.floor((size - 21) / 4) + 1;
  }

  /**
   * Validate QR code version (1-40)
   */
  static isValidVersion(version) {
    return Number.isInteger(version) && version >= 1 && version <= 40;
  }

  /**
   * Get module count for timing pattern calculation
   */
  static getTimingPatternPositions(size) {
    const positions = [];
    for (let i = 8; i < size - 8; i++) {
      positions.push([6, i]); // horizontal timing
      positions.push([i, 6]); // vertical timing
    }
    return positions;
  }
}