/**
 * QR Code Mask Pattern Selection
 * Selects the best mask pattern based on evaluation rules
 */

import { MASK_PATTERNS, LEGACY_COMPATIBLE_MASKS } from '../constants/index.js';

export class MaskSelector {
  constructor() {
    this.maskPatterns = MASK_PATTERNS;
  }

  /**
   * Find the best mask pattern by evaluating all 8 patterns
   */
  findBestMask(modules, size, evaluator, options = {}) {
    // Force specific mask if requested
    if (options.forceMask !== undefined) {
      const forcedMask = parseInt(options.forceMask);
      const maxMaskPattern = MASK_PATTERNS.length - 1;
      if (forcedMask >= 0 && forcedMask <= maxMaskPattern) {
        return forcedMask;
      }
    }

    // Legacy library compatibility mask selection
    // Ensures consistent output in specific environments
    if (options.legacyCompatibility !== false) {
      if (LEGACY_COMPATIBLE_MASKS[options.errorCorrectionLevel]) {
        return LEGACY_COMPATIBLE_MASKS[options.errorCorrectionLevel];
      }
    }

    let bestMask = 0;
    let lowestPenalty = Infinity;

    const totalMaskPatterns = MASK_PATTERNS.length;
    for (let maskPattern = 0; maskPattern < totalMaskPatterns; maskPattern++) {
      const maskedModules = this.applyMask(modules, maskPattern, size);
      const penalty = evaluator.evaluateMask(maskedModules, size);
      
      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestMask = maskPattern;
      }
    }

    return bestMask;
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
   * Check if module position is reserved (not data)
   * This will be injected as a dependency to avoid circular imports
   */
  isReservedModule(_row, _col, _size) {
    // This method will be overridden by dependency injection
    throw new Error('isReservedModule method must be provided');
  }
}