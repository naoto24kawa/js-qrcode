import { FINDER_PATTERN } from './constants.js';
import { getFormatInfo } from './format-info.js';

export class QRPatternBuilder {
  addFinderPatterns(modules, size) {
    const positions = [[0, 0], [size - 7, 0], [0, size - 7]];
    
    positions.forEach(([row, col]) => {
      this.placePattern(modules, FINDER_PATTERN, row, col);
    });
  }

  placePattern(modules, pattern, startRow, startCol) {
    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        modules[startRow + i][startCol + j] = pattern[i][j] === 1;
      }
    }
  }

  addSeparators(modules, size) {
    for (let i = 0; i < 8; i++) {
      modules[7][i] = false;
      modules[i][7] = false;
      modules[7][size - 8 + i] = false;
      modules[size - 8 + i][7] = false;
      modules[size - 8][i] = false;
      modules[size - 8 + i][size - 8] = false;
    }
  }

  addTimingPatterns(modules, size) {
    for (let i = 8; i < size - 8; i++) {
      modules[6][i] = i % 2 === 0;
      modules[i][6] = i % 2 === 0;
    }
  }

  addDarkModule(modules, size, version) {
    // QR Code specification: Dark module at position (4 * version + 9, 8)
    // For version 1: 4 * 1 + 9 = 13
    // For version 2: 4 * 2 + 9 = 17
    modules[4 * version + 9][8] = true;
  }

  addFormatInfo(modules, size, errorCorrectionLevel, maskPattern) {
    const formatBits = getFormatInfo(errorCorrectionLevel, maskPattern);
    
    // フォーマット情報の配置（ISO/IEC 18004準拠）
    // 15ビットを2つのコピーに分けて配置（重複を避ける）
    
    // 第1コピー: 左上のファインダーパターン周辺
    this.placeFirstFormatCopy(modules, size, formatBits);
    
    // 第2コピー: 右上と左下のファインダーパターン周辺
    this.placeSecondFormatCopy(modules, size, formatBits);
    
    // 固定ダークモジュール
    modules[size - 8][8] = true;
  }

  placeFirstFormatCopy(modules, size, formatBits) {
    // 第1コピーの配置位置（ISO/IEC 18004 Table 7 準拠）
    const positions = [
      // 水平方向（行8）: ビット0-5, 6, 7
      { bit: 0, row: 8, col: 0 },   // (8,0)
      { bit: 1, row: 8, col: 1 },   // (8,1)
      { bit: 2, row: 8, col: 2 },   // (8,2)
      { bit: 3, row: 8, col: 3 },   // (8,3)
      { bit: 4, row: 8, col: 4 },   // (8,4)
      { bit: 5, row: 8, col: 5 },   // (8,5)
      { bit: 6, row: 8, col: 7 },   // (8,7) - (8,6)はタイミングパターン
      { bit: 7, row: 8, col: 8 },   // (8,8)
      
      // 垂直方向（列8）: ビット0-5, 6, 7
      { bit: 0, row: 0, col: 8 },   // (0,8)
      { bit: 1, row: 1, col: 8 },   // (1,8)
      { bit: 2, row: 2, col: 8 },   // (2,8)
      { bit: 3, row: 3, col: 8 },   // (3,8)
      { bit: 4, row: 4, col: 8 },   // (4,8)
      { bit: 5, row: 5, col: 8 },   // (5,8)
      { bit: 6, row: 7, col: 8 },   // (7,8) - (6,8)はタイミングパターン
      
      // 垂直方向（列8）下部: ビット8-13
      // タイミングパターン(6,8)の下から上に向かって配置
      { bit: 8, row: 14, col: 8 },  // (14,8)
      { bit: 9, row: 13, col: 8 },  // (13,8)
      { bit: 10, row: 12, col: 8 }, // (12,8)
      { bit: 11, row: 11, col: 8 }, // (11,8)
      { bit: 12, row: 10, col: 8 }, // (10,8)
      { bit: 13, row: 9, col: 8 },  // (9,8)
      // ビット14は第2コピーのみ
    ];
    
    positions.forEach(({ bit, row, col }) => {
      if (row < size && col < size) {
        const bitValue = (formatBits >> bit) & 1;
        modules[row][col] = bitValue === 1;
      }
    });
  }

  placeSecondFormatCopy(modules, size, formatBits) {
    // 第2コピーの配置位置
    const positions = [
      // 下側（列8）: ビット7の複製
      { bit: 7, row: size - 7, col: 8 },    // (size-7,8)
      
      // 右側（行8）: ビット8-14
      { bit: 8, row: 8, col: size - 7 },    // (8,size-7)
      { bit: 9, row: 8, col: size - 6 },    // (8,size-6)
      { bit: 10, row: 8, col: size - 5 },   // (8,size-5)
      { bit: 11, row: 8, col: size - 4 },   // (8,size-4)
      { bit: 12, row: 8, col: size - 3 },   // (8,size-3)
      { bit: 13, row: 8, col: size - 2 },   // (8,size-2)
      { bit: 14, row: 8, col: size - 1 },   // (8,size-1)
    ];
    
    positions.forEach(({ bit, row, col }) => {
      if (row < size && col < size) {
        const bitValue = (formatBits >> bit) & 1;
        modules[row][col] = bitValue === 1;
      }
    });
  }

  addAlignmentPatterns(modules, version) {
    if (version < 2) return;
    
    const positions = this.getAlignmentPatternPositions(version);
    
    positions.forEach(([centerRow, centerCol]) => {
      this.placeAlignmentPattern(modules, centerRow, centerCol);
    });
  }

  placeAlignmentPattern(modules, centerRow, centerCol) {
    // QRコード仕様: 5x5のアライメントパターン
    // 外枠: 黒、内側1層: 白、中央: 黒
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        
        if (row >= 0 && row < modules.length && col >= 0 && col < modules[0].length) {
          const isOuterEdge = Math.abs(i) === 2 || Math.abs(j) === 2;
          const isCenter = i === 0 && j === 0;
          const isInnerEdge = Math.abs(i) === 1 || Math.abs(j) === 1;
          
          if (isOuterEdge || isCenter) {
            modules[row][col] = true;  // 黒
          } else if (isInnerEdge) {
            modules[row][col] = false; // 白
          }
        }
      }
    }
  }

  getAlignmentPatternPositions(version) {
    const centers = this.getAlignmentPatternCenters(version);
    const positions = [];
    const size = 21 + (version - 1) * 4;
    
    for (const row of centers) {
      for (const col of centers) {
        if (!this.isFinderPatternArea(row, col, size)) {
          positions.push([row, col]);
        }
      }
    }
    
    return positions;
  }

  getAlignmentPatternCenters(version) {
    // QR Code specification alignment pattern positions (ISO/IEC 18004)
    const alignmentPatternTable = {
      1: [],
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],  // バージョン4: 33x33サイズ、アライメント位置 (6,26), (26,6), (26,26)
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
      15: [6, 26, 48, 70]
    };
    
    return alignmentPatternTable[version] || [];
  }

  isFinderPatternArea(row, col, size = 25) {
    return (row <= 8 && col <= 8) || 
           (row <= 8 && col >= size - 8) || 
           (row >= size - 8 && col <= 8);
  }
}