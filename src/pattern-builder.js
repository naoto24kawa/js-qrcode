import { 
  FINDER_PATTERN, 
  PATTERN_BUILDER_CONSTANTS, 
  PATTERN_SIZES,
  FORMAT_INFO_PATTERNS,
  MODULE_SIZES,
  ALIGNMENT_PATTERN_TABLE
} from './constants/index.js';
import { getFormatInfo } from './format-info.js';

export class QRPatternBuilder {
  addFinderPatterns(modules, size) {
    const finderSize = PATTERN_SIZES.FINDER;
    const positions = [[0, 0], [size - finderSize, 0], [0, size - finderSize]];
    
    positions.forEach(([row, col]) => {
      this.placePattern(modules, FINDER_PATTERN, row, col);
    });
  }

  placePattern(modules, pattern, startRow, startCol) {
    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        modules[startRow + i][startCol + j] = pattern[i][j] === 1;
      }
    }
  }

  addSeparators(modules, size) {
    const separatorWidth = PATTERN_BUILDER_CONSTANTS.SEPARATOR_WIDTH;
    const separatorPosition = PATTERN_SIZES.FINDER;
    
    for (let i = 0; i < separatorWidth; i++) {
      // Top-left finder pattern separator
      modules[separatorPosition][i] = false;
      modules[i][separatorPosition] = false;
      
      // Top-right finder pattern separator
      modules[separatorPosition][size - separatorWidth + i] = false;
      modules[size - separatorWidth + i][separatorPosition] = false;
      
      // Bottom-left finder pattern separator
      modules[size - separatorWidth][i] = false;
      modules[size - separatorWidth + i][size - separatorWidth] = false;
    }
  }

  addTimingPatterns(modules, size) {
    const timingStart = PATTERN_BUILDER_CONSTANTS.TIMING_START;
    const timingSeparator = PATTERN_BUILDER_CONSTANTS.SEPARATOR_WIDTH;
    const timingPosition = MODULE_SIZES.BASE_SIZE / 3; // Position 6 for timing patterns
    
    for (let i = timingStart; i < size - timingSeparator; i++) {
      modules[timingPosition][i] = i % 2 === 0;
      modules[i][timingPosition] = i % 2 === 0;
    }
  }

  addDarkModule(modules, size, version) {
    // QR Code specification: Dark module at position (4 * version + 9, 8)
    // For version 1: 4 * 1 + 9 = 13
    // For version 2: 4 * 2 + 9 = 17
    const darkModuleRow = PATTERN_BUILDER_CONSTANTS.DARK_MODULE_FORMULA_BASE * version + 
                          PATTERN_BUILDER_CONSTANTS.DARK_MODULE_FORMULA_OFFSET;
    const darkModuleCol = PATTERN_BUILDER_CONSTANTS.SEPARATOR_WIDTH;
    
    modules[darkModuleRow][darkModuleCol] = true;
  }

  addFormatInfo(modules, size, errorCorrectionLevel, maskPattern) {
    // Direct replication of exact patterns from reference library
    // Format information is 15 bits containing error correction level and mask pattern
    // ISO/IEC 18004:2015 Section 7.9 Format information placement
    const pattern = FORMAT_INFO_PATTERNS[errorCorrectionLevel];
    const formatInfoLength = PATTERN_BUILDER_CONSTANTS.FORMAT_INFO_LENGTH;
    const formatInfoPosition = PATTERN_BUILDER_CONSTANTS.SEPARATOR_WIDTH;
    
    if (pattern) {
      // Placement on row 8 (horizontal format information)
      // Placed in top-left area (0-8) and top-right area (size-8 to size-1)
      for (let c = 0; c < formatInfoLength; c++) {
        modules[formatInfoPosition][c] = pattern.row8[c] === 1;
      }
      
      // Placement on column 8 (vertical format information)
      // Placed in top-left area (0-8) and bottom-left area (size-7 to size-1)
      for (let r = 0; r < formatInfoLength; r++) {
        modules[r][formatInfoPosition] = pattern.col8[r] === 1;
      }
    }
    
    // Fixed dark module (set last as it may be overwritten)
    const fixedDarkModuleRow = size - PATTERN_BUILDER_CONSTANTS.SEPARATOR_WIDTH;
    modules[fixedDarkModuleRow][formatInfoPosition] = true;
  }


  addAlignmentPatterns(modules, version) {
    if (version < 2) return;
    
    const positions = this.getAlignmentPatternPositions(version);
    
    positions.forEach(([centerRow, centerCol]) => {
      this.placeAlignmentPattern(modules, centerRow, centerCol);
    });
  }

  placeAlignmentPattern(modules, centerRow, centerCol) {
    // QR Code specification: 5x5 alignment pattern
    // Outer border: black, inner layer: white, center: black
    const radius = PATTERN_BUILDER_CONSTANTS.ALIGNMENT_PATTERN_RADIUS;
    
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        
        if (row >= 0 && row < modules.length && col >= 0 && col < modules[0].length) {
          const isOuterEdge = Math.abs(i) === radius || Math.abs(j) === radius;
          const isCenter = i === 0 && j === 0;
          const isInnerEdge = Math.abs(i) === 1 || Math.abs(j) === 1;
          
          if (isOuterEdge || isCenter) {
            modules[row][col] = true;  // Black
          } else if (isInnerEdge) {
            modules[row][col] = false; // White
          }
        }
      }
    }
  }

  getAlignmentPatternPositions(version) {
    const centers = this.getAlignmentPatternCenters(version);
    const positions = [];
    const size = MODULE_SIZES.BASE_SIZE + (version - 1) * MODULE_SIZES.VERSION_INCREMENT;
    
    for (const row of centers) {
      for (const col of centers) {
        if (!this.isFinderPatternArea(row, col, size)) {
          positions.push([row, col]);
        }
      }
    }
    
    return positions;
  }

  getAlignmentPatternCenters(version) {
    return ALIGNMENT_PATTERN_TABLE[version] || [];
  }

  isFinderPatternArea(row, col, size = 25) {
    const boundarySize = PATTERN_SIZES.FINDER_BOUNDARY_SIZE;
    return (row <= boundarySize && col <= boundarySize) || 
           (row <= boundarySize && col >= size - boundarySize) || 
           (row >= size - boundarySize && col <= boundarySize);
  }
}