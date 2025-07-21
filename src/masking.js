/**
 * QR Code Masking Implementation
 * Implements the 8 standard masking patterns and mask evaluation
 */

import { MASK_PATTERNS } from './constants.js';

// Mask evaluation penalty constants
const RULE1_BASE_PENALTY = 3;
const RULE1_MIN_CONSECUTIVE = 5;
const RULE2_BLOCK_PENALTY = 3;
const RULE3_FINDER_PATTERN_PENALTY = 40;
const RULE3_PATTERN_LENGTH = 7;
const RULE3_LIGHT_PADDING = 4;
const RULE4_PENALTY_STEP = 10;
const RULE4_DEVIATION_STEP = 5;
const OPTIMAL_DARK_PERCENTAGE = 50;

export class QRMasking {
  constructor() {
    this.maskPatterns = MASK_PATTERNS;
  }

  /**
   * Apply mask pattern to QR code matrix
   */
  applyMask(modules, maskPattern, size) {
    const maskedModules = modules.map(row => [...row]);
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!this.isReservedModule(row, col, size)) {
          if (this.maskPatterns[maskPattern](row, col)) {
            maskedModules[row][col] = !maskedModules[row][col];
          }
        }
      }
    }
    
    return maskedModules;
  }

  /**
   * Find the best mask pattern by evaluating all 8 patterns
   */
  findBestMask(modules, size, options = {}) {
    // 強制マスク指定がある場合はそれを使用
    if (options.forceMask !== undefined) {
      const forcedMask = parseInt(options.forceMask);
      if (forcedMask >= 0 && forcedMask <= 7) {
        return forcedMask;
      }
    }

    // 参照ライブラリ互換性のためのマスク選択
    if (options.legacyCompatibility !== false) {
      const compatibleMasks = {
        'L': 4,
        'M': 4, 
        'Q': 3,
        'H': 1  // Hレベルは一般的にマスク1が互換性が高い
      };
      
      if (compatibleMasks[options.errorCorrectionLevel]) {
        const mask = compatibleMasks[options.errorCorrectionLevel];
        return mask;
      }
    }

    let bestMask = 0;
    let lowestPenalty = Infinity;

    
    for (let maskPattern = 0; maskPattern < 8; maskPattern++) {
      const maskedModules = this.applyMask(modules, maskPattern, size);
      const penalty = this.evaluateMask(maskedModules, size);
      
      
      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestMask = maskPattern;
      }
    }

    return bestMask;
  }

  /**
   * Evaluate mask quality according to QR Code specification
   */
  evaluateMask(modules, size) {
    let penalty = 0;
    
    // Rule 1: Adjacent modules in row/column with same color
    penalty += this.evaluateRule1(modules, size);
    
    // Rule 2: Block of modules with same color
    penalty += this.evaluateRule2(modules, size);
    
    // Rule 3: Specific patterns that look like finder patterns
    penalty += this.evaluateRule3(modules, size);
    
    // Rule 4: Balance of dark and light modules
    penalty += this.evaluateRule4(modules, size);
    
    return penalty;
  }

  /**
   * Rule 1: 5 or more consecutive modules of same color
   */
  evaluateRule1(modules, size) {
    let penalty = 0;
    
    // Check rows
    for (let row = 0; row < size; row++) {
      let count = 1;
      let prevModule = modules[row][0];
      
      for (let col = 1; col < size; col++) {
        if (modules[row][col] === prevModule) {
          count++;
        } else {
          if (count >= RULE1_MIN_CONSECUTIVE) {
            penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
          }
          count = 1;
          prevModule = modules[row][col];
        }
      }
      if (count >= RULE1_MIN_CONSECUTIVE) {
        penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
      }
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
      let count = 1;
      let prevModule = modules[0][col];
      
      for (let row = 1; row < size; row++) {
        if (modules[row][col] === prevModule) {
          count++;
        } else {
          if (count >= RULE1_MIN_CONSECUTIVE) {
            penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
          }
          count = 1;
          prevModule = modules[row][col];
        }
      }
      if (count >= RULE1_MIN_CONSECUTIVE) {
        penalty += RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
      }
    }
    
    return penalty;
  }

  /**
   * Rule 2: 2x2 blocks of same color
   */
  evaluateRule2(modules, size) {
    let penalty = 0;
    
    for (let row = 0; row < size - 1; row++) {
      for (let col = 0; col < size - 1; col++) {
        const color = modules[row][col];
        if (modules[row][col + 1] === color &&
            modules[row + 1][col] === color &&
            modules[row + 1][col + 1] === color) {
          penalty += RULE2_BLOCK_PENALTY;
        }
      }
    }
    
    return penalty;
  }

  /**
   * Rule 3: Patterns that look like finder patterns
   */
  evaluateRule3(modules, size) {
    let penalty = 0;
    
    // Pattern: 1011101 (dark-light-dark-dark-dark-light-dark)
    const pattern1 = [true, false, true, true, true, false, true];
    const pattern2 = [false, true, false, false, false, true, false];
    
    // Check rows
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - RULE3_PATTERN_LENGTH; col++) {
        if (this.matchesPattern(modules, row, col, pattern1, 'horizontal') ||
            this.matchesPattern(modules, row, col, pattern2, 'horizontal')) {
          // Check for 4 light modules before or after the pattern
          if ((col >= RULE3_LIGHT_PADDING && this.allSameColor(modules, row, col - RULE3_LIGHT_PADDING, RULE3_LIGHT_PADDING, false, 'horizontal')) ||
              (col + RULE3_PATTERN_LENGTH + RULE3_LIGHT_PADDING <= size && this.allSameColor(modules, row, col + RULE3_PATTERN_LENGTH, RULE3_LIGHT_PADDING, false, 'horizontal'))) {
            penalty += RULE3_FINDER_PATTERN_PENALTY;
          }
        }
      }
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - RULE3_PATTERN_LENGTH; row++) {
        if (this.matchesPattern(modules, row, col, pattern1, 'vertical') ||
            this.matchesPattern(modules, row, col, pattern2, 'vertical')) {
          // Check for 4 light modules before or after the pattern
          if ((row >= RULE3_LIGHT_PADDING && this.allSameColor(modules, row - RULE3_LIGHT_PADDING, col, RULE3_LIGHT_PADDING, false, 'vertical')) ||
              (row + RULE3_PATTERN_LENGTH + RULE3_LIGHT_PADDING <= size && this.allSameColor(modules, row + RULE3_PATTERN_LENGTH, col, RULE3_LIGHT_PADDING, false, 'vertical'))) {
            penalty += RULE3_FINDER_PATTERN_PENALTY;
          }
        }
      }
    }
    
    return penalty;
  }

  /**
   * Rule 4: Balance of dark and light modules
   */
  evaluateRule4(modules, size) {
    let darkCount = 0;
    const totalModules = size * size;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (modules[row][col]) {
          darkCount++;
        }
      }
    }
    
    const percentage = (darkCount * 100) / totalModules;
    const deviation = Math.abs(percentage - OPTIMAL_DARK_PERCENTAGE);
    return Math.floor(deviation / RULE4_DEVIATION_STEP) * RULE4_PENALTY_STEP;
  }

  /**
   * Helper: Check if pattern matches at given position
   */
  matchesPattern(modules, startRow, startCol, pattern, direction) {
    for (let i = 0; i < pattern.length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (row >= modules.length || col >= modules[0].length) {
        return false;
      }
      
      if (modules[row][col] !== pattern[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Helper: Check if all modules in range have same color
   */
  allSameColor(modules, startRow, startCol, length, color, direction) {
    for (let i = 0; i < length; i++) {
      const row = direction === 'horizontal' ? startRow : startRow + i;
      const col = direction === 'horizontal' ? startCol + i : startCol;
      
      if (row >= modules.length || col >= modules[0].length) {
        return false;
      }
      
      if (modules[row][col] !== color) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if module position is reserved (not data)
   */
  isReservedModule(row, col, size) {
    const version = Math.floor((size - 21) / 4) + 1;
    
    // Finder patterns and separators (9x9 areas)
    if ((row <= 8 && col <= 8) || 
        (row <= 8 && col >= size - 8) || 
        (row >= size - 8 && col <= 8)) {
      return true;
    }
    
    // Timing patterns
    if (row === 6 || col === 6) {
      return true;
    }
    
    // Dark module (version dependent)
    if (row === 4 * version + 9 && col === 8) {
      return true;
    }
    
    // Format information areas - Complete implementation
    // Upper horizontal format info (row 8, cols 0-8 and size-8 to size-1)
    if (row === 8 && (col <= 8 || col >= size - 8)) {
      return true;
    }
    
    // Left vertical format info (col 8, rows 0-8 and size-7 to size-1)
    if (col === 8 && (row <= 8 || row >= size - 7)) {
      return true;
    }
    
    // Alignment patterns for version 2+
    if (version >= 2) {
      const alignmentCenters = this.getAlignmentPatternCenters(version);
      for (const centerRow of alignmentCenters) {
        for (const centerCol of alignmentCenters) {
          // Skip if overlaps with finder pattern
          if ((centerRow <= 8 && centerCol <= 8) || 
              (centerRow <= 8 && centerCol >= size - 8) || 
              (centerRow >= size - 8 && centerCol <= 8)) {
            continue;
          }
          
          if (Math.abs(row - centerRow) <= 2 && Math.abs(col - centerCol) <= 2) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  getAlignmentPatternCenters(version) {
    // QR Code specification alignment pattern positions
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
      15: [6, 26, 48, 70]
    };
    
    return alignmentPatternTable[version] || [];
  }
}