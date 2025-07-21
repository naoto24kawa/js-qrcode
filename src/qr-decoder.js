/**
 * QR Code Decoder - Refactored Version
 * Main orchestrator for QR code decoding process
 * Uses separated components for better maintainability
 */

import { ImagePreprocessor } from './image-preprocessor.js';
import { FinderPatternDetector } from './finder-pattern-detector.js';
import { PerspectiveCorrector } from './perspective-corrector.js';
import { QRSpecUtils } from './qr-spec-utils.js';
import { ErrorFactory, QRCodeDecodeError } from './errors.js';
import { ALPHANUMERIC_CHARS } from './constants.js';

export class QRCodeDecoder {
  constructor(options = {}) {
    this.options = {
      enableDiagnostics: false,
      qualityCheck: true,
      adaptiveThreshold: true,
      ...options
    };

    // Initialize component classes
    this.imagePreprocessor = new ImagePreprocessor({
      adaptiveThreshold: this.options.adaptiveThreshold
    });
    
    this.finderDetector = new FinderPatternDetector();
    this.perspectiveCorrector = new PerspectiveCorrector({
      qualityCheck: this.options.qualityCheck
    });

    // Diagnostics data
    this.diagnostics = {
      enabled: this.options.enableDiagnostics,
      data: {}
    };

    // Encoding modes
    this.modes = {
      1: 'NUMERIC',
      2: 'ALPHANUMERIC', 
      4: 'BYTE',
      8: 'KANJI'
    };
  }

  /**
   * Main decode method - orchestrates the entire decoding process
   */
  async decode(data, options = {}) {
    try {
      this.startDiagnostics();

      // Step 1: Preprocess image data into binary matrix
      const binaryMatrix = await this.imagePreprocessor.preprocessImage(
        data, 
        options.width, 
        options.height
      );
      this.addDiagnostic('preprocessing', {
        matrixSize: `${binaryMatrix.length}x${binaryMatrix[0].length}`,
        statistics: this.imagePreprocessor.getStatistics(data, binaryMatrix)
      });

      // Step 2: Find finder patterns
      const finderPatterns = this.finderDetector.findFinderPatterns(binaryMatrix);
      this.addDiagnostic('finderPatterns', {
        count: finderPatterns.length,
        patterns: finderPatterns,
        statistics: this.finderDetector.getDetectionStatistics(finderPatterns)
      });

      // Step 3: Apply perspective correction
      const correctionResult = this.perspectiveCorrector.correctPerspective(
        binaryMatrix, 
        finderPatterns
      );
      this.addDiagnostic('perspectiveCorrection', {
        dimensions: correctionResult.dimensions,
        statistics: this.perspectiveCorrector.getCorrectionStatistics(correctionResult)
      });

      // Step 4: Extract format information and decode data
      const qrData = this.decodeMatrix(correctionResult.matrix, correctionResult.dimensions);
      this.addDiagnostic('decoding', {
        success: true,
        dataLength: qrData?.length || 0,
        version: correctionResult.dimensions.version
      });

      return qrData;

    } catch (error) {
      this.addDiagnostic('error', {
        error: error.toJSON ? error.toJSON() : { message: error.message, stack: error.stack }
      });

      if (error instanceof QRCodeDecodeError) {
        throw error;
      }
      
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.DATA_DECODE_ERROR,
        `QR code decoding failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Decode QR matrix data
   */
  decodeMatrix(matrix, dimensions) {
    try {
      // Read format information (error correction level and mask pattern)
      const formatInfo = this.readFormatInfo(matrix);
      
      // Apply unmask to data modules
      const unmaskedMatrix = this.applyUnmask(matrix, formatInfo.maskPattern);
      
      // Read data modules
      const rawData = this.readDataModules(unmaskedMatrix, dimensions.version);
      
      // Decode based on mode
      return this.decodeData(rawData, dimensions.version);
      
    } catch (error) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.DATA_DECODE_ERROR,
        `Matrix decoding failed: ${error.message}`,
        { originalError: error, matrixSize: matrix.length }
      );
    }
  }

  /**
   * Read format information from QR code
   */
  readFormatInfo(matrix) {
    const size = matrix.length;
    let formatBits = [];

    // Read horizontal format info (row 8, skipping timing column)
    for (let x = 0; x < 9; x++) {
      if (x !== 6) { // Skip timing pattern column
        formatBits.push(matrix[8][x] ? 1 : 0);
      }
    }
    
    // Read remaining horizontal format info
    for (let x = size - 7; x < size; x++) {
      formatBits.push(matrix[8][x] ? 1 : 0);
    }

    // Convert format bits to format info
    const formatValue = this.bitsToValue(formatBits);
    
    // Decode format info (simplified - would need proper BCH decoding)
    const errorCorrectionLevel = this.getErrorCorrectionLevel(formatValue);
    const maskPattern = this.getMaskPattern(formatValue);

    return {
      errorCorrectionLevel,
      maskPattern,
      rawValue: formatValue
    };
  }

  /**
   * Apply unmask to reveal original data
   */
  applyUnmask(matrix, maskPattern) {
    const size = matrix.length;
    const unmasked = matrix.map(row => [...row]);

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!QRSpecUtils.isReservedModule(row, col, size)) {
          const maskValue = this.getMaskValue(row, col, maskPattern);
          if (maskValue) {
            unmasked[row][col] = !unmasked[row][col];
          }
        }
      }
    }

    return unmasked;
  }

  /**
   * Get mask value for given position and pattern
   */
  getMaskValue(row, col, pattern) {
    switch (pattern) {
      case 0: return (row + col) % 2 === 0;
      case 1: return row % 2 === 0;
      case 2: return col % 3 === 0;
      case 3: return (row + col) % 3 === 0;
      case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
      case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
      case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
      case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
      default: return false;
    }
  }

  /**
   * Read data modules in the correct order
   */
  readDataModules(matrix, version) {
    const size = matrix.length;
    const dataBits = [];
    let direction = -1; // -1: up, 1: down

    // Read modules in columns from right to left
    for (let col = size - 1; col > 0; col -= 2) {
      // Skip timing pattern column
      if (col === 6) col--;

      // Read two columns at a time
      for (let i = 0; i < size; i++) {
        for (let c = 0; c < 2; c++) {
          const x = col - c;
          const y = direction === -1 ? size - 1 - i : i;

          if (!QRSpecUtils.isReservedModule(y, x, size, version)) {
            dataBits.push(matrix[y][x] ? 1 : 0);
          }
        }
      }

      direction = -direction; // Change direction for zigzag pattern
    }

    return dataBits;
  }

  /**
   * Decode data bits based on encoding mode
   */
  decodeData(dataBits, version) {
    let bitIndex = 0;

    // Read mode indicator (4 bits)
    const modeValue = this.readBits(dataBits, bitIndex, 4);
    bitIndex += 4;

    const mode = this.modes[modeValue];
    if (!mode) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.DATA_DECODE_ERROR,
        `Unknown encoding mode: ${modeValue}`
      );
    }

    // Read character count
    const countLength = this.getCharacterCountLength(mode, version);
    const characterCount = this.readBits(dataBits, bitIndex, countLength);
    bitIndex += countLength;

    // Decode based on mode
    switch (mode) {
      case 'NUMERIC':
        return this.decodeNumeric(dataBits, bitIndex, characterCount);
      case 'ALPHANUMERIC':
        return this.decodeAlphanumeric(dataBits, bitIndex, characterCount);
      case 'BYTE':
        return this.decodeByte(dataBits, bitIndex, characterCount);
      default:
        throw ErrorFactory.createDecodeError(
          QRCodeDecodeError.CODES.DATA_DECODE_ERROR,
          `Unsupported encoding mode: ${mode}`
        );
    }
  }

  /**
   * Decode numeric mode data
   */
  decodeNumeric(dataBits, startIndex, characterCount) {
    let result = '';
    let bitIndex = startIndex;

    for (let i = 0; i < characterCount; i += 3) {
      const groupSize = Math.min(3, characterCount - i);
      const bitLength = groupSize === 3 ? 10 : groupSize === 2 ? 7 : 4;
      
      const value = this.readBits(dataBits, bitIndex, bitLength);
      bitIndex += bitLength;
      
      result += value.toString().padStart(groupSize, '0');
    }

    return result.substring(0, characterCount);
  }

  /**
   * Decode alphanumeric mode data
   */
  decodeAlphanumeric(dataBits, startIndex, characterCount) {
    let result = '';
    let bitIndex = startIndex;

    for (let i = 0; i < characterCount; i += 2) {
      if (i + 1 < characterCount) {
        // Pair of characters
        const value = this.readBits(dataBits, bitIndex, 11);
        bitIndex += 11;
        
        const char1 = ALPHANUMERIC_CHARS[Math.floor(value / 45)];
        const char2 = ALPHANUMERIC_CHARS[value % 45];
        result += char1 + char2;
      } else {
        // Single character
        const value = this.readBits(dataBits, bitIndex, 6);
        bitIndex += 6;
        
        result += ALPHANUMERIC_CHARS[value];
      }
    }

    return result;
  }

  /**
   * Decode byte mode data
   */
  decodeByte(dataBits, startIndex, characterCount) {
    const bytes = [];
    let bitIndex = startIndex;

    for (let i = 0; i < characterCount; i++) {
      const byte = this.readBits(dataBits, bitIndex, 8);
      bitIndex += 8;
      bytes.push(byte);
    }

    // Convert bytes to string (assuming UTF-8)
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  }

  /**
   * Read specified number of bits from data array
   */
  readBits(dataBits, startIndex, count) {
    let result = 0;
    for (let i = 0; i < count; i++) {
      if (startIndex + i < dataBits.length) {
        result = (result << 1) | dataBits[startIndex + i];
      }
    }
    return result;
  }

  /**
   * Get character count length based on mode and version
   */
  getCharacterCountLength(mode, version) {
    if (mode === 'NUMERIC') {
      return version <= 9 ? 10 : version <= 26 ? 12 : 14;
    } else if (mode === 'ALPHANUMERIC') {
      return version <= 9 ? 9 : version <= 26 ? 11 : 13;
    } else if (mode === 'BYTE') {
      return version <= 9 ? 8 : 16;
    }
    return 8;
  }

  /**
   * Convert bit array to numeric value
   */
  bitsToValue(bits) {
    return bits.reduce((value, bit) => (value << 1) | bit, 0);
  }

  /**
   * Get error correction level from format info
   */
  getErrorCorrectionLevel(formatValue) {
    // Simplified extraction - would need proper BCH decoding
    const ecl = (formatValue >> 3) & 0x03;
    return ['M', 'L', 'H', 'Q'][ecl] || 'M';
  }

  /**
   * Get mask pattern from format info
   */
  getMaskPattern(formatValue) {
    // Simplified extraction - would need proper BCH decoding
    return formatValue & 0x07;
  }

  /**
   * Diagnostics methods
   */
  startDiagnostics() {
    if (this.diagnostics.enabled) {
      this.diagnostics.data = {
        startTime: Date.now(),
        steps: {}
      };
    }
  }

  addDiagnostic(step, data) {
    if (this.diagnostics.enabled) {
      this.diagnostics.data.steps[step] = {
        timestamp: Date.now(),
        data: data
      };
    }
  }

  getDiagnostics() {
    if (!this.diagnostics.enabled) {
      return null;
    }

    return {
      ...this.diagnostics.data,
      totalTime: Date.now() - this.diagnostics.data.startTime
    };
  }

  /**
   * Enable or disable diagnostics
   */
  setDiagnosticsEnabled(enabled) {
    this.diagnostics.enabled = enabled;
  }
}