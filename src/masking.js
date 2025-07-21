/**
 * QR Code Masking Implementation
 * Simplified facade for mask pattern selection and application
 */

import { MaskPatternEvaluator } from './masking/mask-pattern-evaluator.js';
import { MaskSelector } from './masking/mask-selector.js';
import { QRSpecUtils } from './qr-spec-utils.js';

export class QRMasking {
  constructor() {
    this.evaluator = new MaskPatternEvaluator();
    this.selector = new MaskSelector();
    
    // Inject dependency to avoid circular imports
    this.selector.isReservedModule = (row, col, size) => {
      return QRSpecUtils.isReservedModule(row, col, size);
    };
  }

  /**
   * Apply mask pattern to QR code matrix
   */
  applyMask(modules, maskPattern, size) {
    return this.selector.applyMask(modules, maskPattern, size);
  }

  /**
   * Find the best mask pattern by evaluating all 8 patterns
   */
  findBestMask(modules, size, options = {}) {
    return this.selector.findBestMask(modules, size, this.evaluator, options);
  }

  /**
   * Evaluate mask quality according to QR Code specification
   */
  evaluateMask(modules, size) {
    return this.evaluator.evaluateMask(modules, size);
  }

  /**
   * Check if module position is reserved (not data)
   * Uses shared QRSpecUtils for consistency
   */
  isReservedModule(row, col, size) {
    return QRSpecUtils.isReservedModule(row, col, size);
  }
}