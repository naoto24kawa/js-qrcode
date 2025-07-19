import { MODULE_SIZES } from './constants.js';
import { QRPatternBuilder } from './pattern-builder.js';

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
    return MODULE_SIZES.BASE_SIZE + (version - 1) * MODULE_SIZES.VERSION_INCREMENT;
  }

  createEmptyMatrix(size) {
    return Array(size).fill().map(() => Array(size).fill(false));
  }

  addPatterns(modules, size, version, errorCorrectionLevel) {
    this.patternBuilder.addFinderPatterns(modules, size);
    this.patternBuilder.addSeparators(modules, size);
    this.patternBuilder.addTimingPatterns(modules, size);
    this.patternBuilder.addDarkModule(modules, size, version);
    this.patternBuilder.addFormatInfo(modules, size, errorCorrectionLevel, 0);
    
    if (version >= 2) {
      this.patternBuilder.addAlignmentPatterns(modules, version);
    }
  }

  addDataBits(modules, dataBits, size, version = 1) {
    let bitIndex = 0;
    let up = true;
    
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col--;
      
      for (let count = 0; count < size; count++) {
        const row = up ? size - 1 - count : count;
        
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          
          if (!this.isReservedModule(row, currentCol, size, version)) {
            if (bitIndex < dataBits.length) {
              modules[row][currentCol] = dataBits[bitIndex] === '1';
              bitIndex++;
            } else {
              modules[row][currentCol] = false;
            }
          }
        }
      }
      
      up = !up;
    }
  }

  addFormatInfoWithMask(modules, size, errorCorrectionLevel, maskPattern) {
    const result = modules.map(row => [...row]);
    this.patternBuilder.addFormatInfo(result, size, errorCorrectionLevel, maskPattern);
    return result;
  }

  isReservedModule(row, col, size, version = 1) {
    if (row < 0 || row >= size || col < 0 || col >= size) return true;
    
    // Finder pattern areas (including separators)
    if ((row <= 8 && col <= 8) || 
        (row <= 8 && col >= size - 8) || 
        (row >= size - 8 && col <= 8)) {
      return true;
    }
    
    // Timing pattern
    if (row === 6 || col === 6) return true;
    
    // Dark module
    if (row === 4 * version + 9 && col === 8) return true;
    
    // Alignment patterns for version 2+
    if (version >= 2) {
      const centers = this.getAlignmentPatternCenters(version);
      for (const centerRow of centers) {
        for (const centerCol of centers) {
          if (!this.isFinderPatternArea(centerRow, centerCol, size)) {
            if (Math.abs(row - centerRow) <= 2 && Math.abs(col - centerCol) <= 2) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  getAlignmentPatternCenters(version) {
    const centerMap = {
      1: [],
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30]
    };
    
    return centerMap[version] || [6, 18, 30];
  }

  isFinderPatternArea(row, col, size) {
    return (row <= 8 && col <= 8) || 
           (row <= 8 && col >= size - 8) || 
           (row >= size - 8 && col <= 8);
  }
}