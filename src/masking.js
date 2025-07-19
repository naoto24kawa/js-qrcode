/**
 * QR Code Masking Implementation
 * Implements the 8 standard masking patterns and mask evaluation
 */

import { MASK_PATTERNS } from './constants.js';

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
  findBestMask(modules, size) {
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
          if (count >= 5) {
            penalty += 3 + (count - 5);
          }
          count = 1;
          prevModule = modules[row][col];
        }
      }
      if (count >= 5) {
        penalty += 3 + (count - 5);
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
          if (count >= 5) {
            penalty += 3 + (count - 5);
          }
          count = 1;
          prevModule = modules[row][col];
        }
      }
      if (count >= 5) {
        penalty += 3 + (count - 5);
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
          penalty += 3;
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
      for (let col = 0; col <= size - 7; col++) {
        if (this.matchesPattern(modules, row, col, pattern1, 'horizontal') ||
            this.matchesPattern(modules, row, col, pattern2, 'horizontal')) {
          // Check for 4 light modules before or after the pattern
          if ((col >= 4 && this.allSameColor(modules, row, col - 4, 4, false, 'horizontal')) ||
              (col + 7 + 4 <= size && this.allSameColor(modules, row, col + 7, 4, false, 'horizontal'))) {
            penalty += 40;
          }
        }
      }
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - 7; row++) {
        if (this.matchesPattern(modules, row, col, pattern1, 'vertical') ||
            this.matchesPattern(modules, row, col, pattern2, 'vertical')) {
          // Check for 4 light modules before or after the pattern
          if ((row >= 4 && this.allSameColor(modules, row - 4, col, 4, false, 'vertical')) ||
              (row + 7 + 4 <= size && this.allSameColor(modules, row + 7, col, 4, false, 'vertical'))) {
            penalty += 40;
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
    const deviation = Math.abs(percentage - 50);
    return Math.floor(deviation / 5) * 10;
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
    // Finder patterns
    if ((row <= 8 && col <= 8) || 
        (row <= 8 && col >= size - 8) || 
        (row >= size - 8 && col <= 8)) {
      return true;
    }
    
    // Timing patterns
    if (row === 6 || col === 6) {
      return true;
    }
    
    // Dark module
    if (row === 4 * 1 + 9 && col === 8) { // Assuming version 1
      return true;
    }
    
    // Format information areas
    if ((row === 8 && (col <= 8 || col >= size - 8)) ||
        (col === 8 && (row <= 8 || row >= size - 7))) {
      return true;
    }
    
    return false;
  }
}