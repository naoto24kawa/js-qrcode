/**
 * QR Code Mask Pattern Evaluation
 * Evaluates mask patterns according to QR Code specification rules
 */

import { MASK_EVALUATION_PENALTIES } from '../constants/index.js';

const {
  RULE1_BASE_PENALTY,
  RULE1_MIN_CONSECUTIVE,
  RULE2_BLOCK_PENALTY,
  RULE3_FINDER_PATTERN_PENALTY,
  RULE3_PATTERN_LENGTH,
  RULE3_LIGHT_PADDING,
  RULE4_PENALTY_STEP,
  RULE4_DEVIATION_STEP,
  OPTIMAL_DARK_PERCENTAGE
} = MASK_EVALUATION_PENALTIES;

export class MaskPatternEvaluator {
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
   * Penalty: 3 + (consecutive count - 5) points per occurrence
   * Reference: ISO/IEC 18004:2015 Section 7.8.3.1
   */
  evaluateRule1(modules, size) {
    let penalty = 0;
    
    // Check rows for consecutive modules
    penalty += this.checkConsecutiveInRows(modules, size);
    
    // Check columns for consecutive modules
    penalty += this.checkConsecutiveInColumns(modules, size);
    
    return penalty;
  }
  
  checkConsecutiveInRows(modules, size) {
    let penalty = 0;
    
    for (let row = 0; row < size; row++) {
      penalty += this.checkConsecutiveInLine(modules[row]);
    }
    
    return penalty;
  }
  
  checkConsecutiveInColumns(modules, size) {
    let penalty = 0;
    
    for (let col = 0; col < size; col++) {
      const column = [];
      for (let row = 0; row < size; row++) {
        column.push(modules[row][col]);
      }
      penalty += this.checkConsecutiveInLine(column);
    }
    
    return penalty;
  }
  
  checkConsecutiveInLine(line) {
    let penalty = 0;
    let count = 1;
    let prevModule = line[0];
    
    for (let i = 1; i < line.length; i++) {
      if (line[i] === prevModule) {
        count++;
      } else {
        penalty += this.calculateConsecutivePenalty(count);
        count = 1;
        prevModule = line[i];
      }
    }
    
    // Check final sequence
    penalty += this.calculateConsecutivePenalty(count);
    
    return penalty;
  }
  
  calculateConsecutivePenalty(count) {
    if (count >= RULE1_MIN_CONSECUTIVE) {
      return RULE1_BASE_PENALTY + (count - RULE1_MIN_CONSECUTIVE);
    }
    return 0;
  }

  /**
   * Rule 2: 2x2 blocks of same color
   * Penalty: 3 points per 2x2 block of same color
   * Reference: ISO/IEC 18004:2015 Section 7.8.3.2
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
   * Penalty: 40 points per occurrence of patterns like finder patterns
   * Patterns: 1011101 or 0100010 with 4 light modules padding
   * Reference: ISO/IEC 18004:2015 Section 7.8.3.3
   */
  evaluateRule3(modules, size) {
    let penalty = 0;
    
    // Pattern: 1011101 (dark-light-dark-dark-dark-light-dark)
    const pattern1 = [true, false, true, true, true, false, true];
    const pattern2 = [false, true, false, false, false, true, false];
    
    penalty += this.checkPatternInRows(modules, size, pattern1, pattern2);
    penalty += this.checkPatternInColumns(modules, size, pattern1, pattern2);
    
    return penalty;
  }

  checkPatternInRows(modules, size, pattern1, pattern2) {
    let penalty = 0;
    
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
    
    return penalty;
  }

  checkPatternInColumns(modules, size, pattern1, pattern2) {
    let penalty = 0;
    
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
   * Penalty: 10 points per 5% deviation from 50% dark modules
   * Reference: ISO/IEC 18004:2015 Section 7.8.3.4
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
}