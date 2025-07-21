import { MODULE_SIZES, MODULE_BUILDER_CONSTANTS } from './constants/index.js';
import { QRPatternBuilder } from './pattern-builder.js';
import { QRSpecUtils } from './qr-spec-utils.js';

export class QRModuleBuilder {
  constructor() {
    this.patternBuilder = new QRPatternBuilder();
  }

  generateModules(dataBits, version, errorCorrectionLevel) {
    const size = this.calculateSize(version);
    const modules = this.createEmptyMatrix(size);
    
    this.addPatterns(modules, size, version, errorCorrectionLevel);
    this.addDataBits(modules, dataBits, size, version);
    
    return modules;
  }

  calculateSize(version) {
    return QRSpecUtils.calculateQRSize(version);
  }

  createEmptyMatrix(size) {
    return Array(size).fill().map(() => Array(size).fill(false));
  }

  addPatterns(modules, size, version, errorCorrectionLevel) {
    this.patternBuilder.addFinderPatterns(modules, size);
    this.patternBuilder.addSeparators(modules, size);
    this.patternBuilder.addTimingPatterns(modules, size);
    
    if (version >= 2) {
      this.patternBuilder.addAlignmentPatterns(modules, version);
    }
    
    // Add format info first, then dark module to ensure it's not overwritten
    this.patternBuilder.addFormatInfo(modules, size, errorCorrectionLevel, 0);
    this.patternBuilder.addDarkModule(modules, size, version);
  }

  addDataBits(modules, dataBits, size, version = 1) {
    // Data placement algorithm according to QR specification
    // ISO/IEC 18004:2015 Section 7.7.3 Symbol character placement
    let bitIndex = 0;
    let direction = MODULE_BUILDER_CONSTANTS.DIRECTION_UP; // -1: upward (bottom to top), 1: downward (top to bottom)
    
    // Process from right to left, 2 columns at a time in pairs (zigzag pattern)
    for (let col = size - 1; col > 0; col -= MODULE_BUILDER_CONSTANTS.COLUMN_STEP) {
      // Skip timing pattern column 6 (special rule in QR specification)
      if (col === MODULE_BUILDER_CONSTANTS.TIMING_POSITION) {
        col--;
      }
      
      // Place data vertically in each 2-column pair
      // Place in order: right column → left column
      for (let i = 0; i < size; i++) {
        for (let c = 0; c < MODULE_BUILDER_CONSTANTS.COLUMN_STEP; c++) {
          const x = col - c; // From right column (c=0) to left column (c=1)
          const y = direction === MODULE_BUILDER_CONSTANTS.DIRECTION_UP ? size - 1 - i : i; // Calculate coordinates according to direction
          
          if (!this.isReservedModule(y, x, size, version)) {
            if (bitIndex < dataBits.length) {
              modules[y][x] = dataBits[bitIndex] === '1';
            } else {
              modules[y][x] = false; // Padding bits (if necessary)
            }
            bitIndex++;
          }
        }
      }
      
      // Reverse direction after processing each 2-column pair (to achieve zigzag pattern)
      direction = -direction;
    }
    
  }

  addFormatInfoWithMask(modules, size, errorCorrectionLevel, maskPattern) {
    const result = modules.map(row => [...row]);
    const version = Math.floor((size - MODULE_SIZES.BASE_SIZE) / MODULE_SIZES.VERSION_INCREMENT) + 1;
    
    this.patternBuilder.addFormatInfo(result, size, errorCorrectionLevel, maskPattern);
    // Ensure dark module is always set after format info
    this.patternBuilder.addDarkModule(result, size, version);
    
    return result;
  }

  isReservedModule(row, col, size, version = 1) {
    return QRSpecUtils.isReservedModule(row, col, size, version);
  }
}