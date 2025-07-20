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
    
    if (version >= 2) {
      this.patternBuilder.addAlignmentPatterns(modules, version);
    }
    
    // Add format info first, then dark module to ensure it's not overwritten
    this.patternBuilder.addFormatInfo(modules, size, errorCorrectionLevel, 0);
    this.patternBuilder.addDarkModule(modules, size, version);
  }

  addDataBits(modules, dataBits, size, version = 1) {
    // QR仕様に従ったデータ配置アルゴリズム
    let bitIndex = 0;
    let direction = -1; // -1: 上向き, 1: 下向き
    
    // 右から左へ、2列ずつペアで処理
    for (let col = size - 1; col > 0; col -= 2) {
      // タイミングパターンの列6をスキップ
      if (col === 6) {
        col--;
      }
      
      // 各2列ペアで垂直方向にデータを配置
      for (let i = 0; i < size; i++) {
        for (let c = 0; c < 2; c++) {
          const x = col - c;
          const y = direction === -1 ? size - 1 - i : i;
          
          if (!this.isReservedModule(y, x, size, version)) {
            if (bitIndex < dataBits.length) {
              modules[y][x] = dataBits[bitIndex] === '1';
            } else {
              modules[y][x] = false; // パディングビット
            }
            bitIndex++;
          }
        }
      }
      
      // 方向を反転
      direction = -direction;
    }
    
    console.log(`データビット配置完了: ${bitIndex}ビット配置済み`);
  }

  addFormatInfoWithMask(modules, size, errorCorrectionLevel, maskPattern) {
    const result = modules.map(row => [...row]);
    const version = Math.floor((size - 21) / 4) + 1;
    
    this.patternBuilder.addFormatInfo(result, size, errorCorrectionLevel, maskPattern);
    // Ensure dark module is always set after format info
    this.patternBuilder.addDarkModule(result, size, version);
    
    return result;
  }

  isReservedModule(row, col, size, version = 1) {
    if (row < 0 || row >= size || col < 0 || col >= size) return true;
    
    // Finder pattern areas (including separators) - 9x9 areas
    if ((row <= 8 && col <= 8) || 
        (row <= 8 && col >= size - 8) || 
        (row >= size - 8 && col <= 8)) {
      return true;
    }
    
    // Timing patterns
    if (row === 6 || col === 6) return true;
    
    // Dark module
    if (row === 4 * version + 9 && col === 8) return true;
    
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
      15: [6, 26, 48, 70],
      16: [6, 26, 50, 74],
      17: [6, 30, 54, 78],
      18: [6, 30, 56, 82],
      19: [6, 30, 58, 86],
      20: [6, 34, 62, 90]
    };
    
    return alignmentPatternTable[version] || [];
  }

  isFinderPatternArea(row, col, size) {
    return (row <= 8 && col <= 8) || 
           (row <= 8 && col >= size - 8) || 
           (row >= size - 8 && col <= 8);
  }
}