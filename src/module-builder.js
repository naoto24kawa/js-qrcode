import { MODULE_SIZES } from './constants.js';
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
    // QR仕様に従ったデータ配置アルゴリズム
    // ISO/IEC 18004:2015 Section 7.7.3 Symbol character placement
    let bitIndex = 0;
    let direction = -1; // -1: 上向き（下から上へ）, 1: 下向き（上から下へ）
    
    // 右から左へ、2列ずつペアで処理（ジグザグパターン）
    for (let col = size - 1; col > 0; col -= 2) {
      // タイミングパターンの列6をスキップ（QR仕様の特別ルール）
      if (col === 6) {
        col--;
      }
      
      // 各2列ペアで垂直方向にデータを配置
      // 右列→左列の順で配置
      for (let i = 0; i < size; i++) {
        for (let c = 0; c < 2; c++) {
          const x = col - c; // 右列（c=0）から左列（c=1）へ
          const y = direction === -1 ? size - 1 - i : i; // 方向に応じて座標計算
          
          if (!this.isReservedModule(y, x, size, version)) {
            if (bitIndex < dataBits.length) {
              modules[y][x] = dataBits[bitIndex] === '1';
            } else {
              modules[y][x] = false; // パディングビット（必要に応じて）
            }
            bitIndex++;
          }
        }
      }
      
      // 各2列ペア処理後、方向を反転（ジグザグパターンを実現）
      direction = -direction;
    }
    
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
    return QRSpecUtils.isReservedModule(row, col, size, version);
  }
}