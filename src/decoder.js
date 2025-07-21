/**
 * QR Code Decoder - Legacy Compatibility Layer
 * Provides backward compatibility while using the new refactored architecture
 */

import { QRCodeDecoder as RefactoredDecoder } from './qr-decoder.js';
import { FINDER_PATTERN } from './constants.js';

export class QRCodeDecoder {
  constructor(options = {}) {
    // Initialize refactored decoder
    this.refactoredDecoder = new RefactoredDecoder({
      enableDiagnostics: false,
      ...options
    });

    // Backward compatibility properties
    this.modes = {
      1: 'NUMERIC',
      2: 'ALPHANUMERIC', 
      4: 'BYTE',
      8: 'KANJI'
    };
    
    // Backward compatibility for tests
    this.patterns = {
      FINDER: FINDER_PATTERN
    };
  }
  
  /**
   * Main decode method - delegates to refactored decoder
   * Maintains exact same API for backward compatibility
   */
  async decode(data, options = {}) {
    try {
      return await this.refactoredDecoder.decode(data, options);
    } catch (error) {
      // Legacy behavior: return null on error instead of throwing
      return null;
    }
  }

  /**
   * Legacy method compatibility - delegate to refactored decoder
   */
  async preprocessImage(data, options) {
    return await this.refactoredDecoder.imagePreprocessor.preprocessImage(data, options.width, options.height);
  }

  /**
   * Legacy method compatibility - delegate to refactored decoder  
   */
  extractMatrix(imageData) {
    return this.refactoredDecoder.imagePreprocessor.createBinaryMatrix(imageData);
  }

  /**
   * Legacy method compatibility - delegate to refactored decoder
   */
  decodeMatrix(matrix) {
    try {
      const mockDimensions = { version: 1, size: matrix.length };
      return this.refactoredDecoder.decodeMatrix(matrix, mockDimensions);
    } catch (error) {
      return null;
    }
  }
}