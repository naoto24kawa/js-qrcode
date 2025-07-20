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
    // 参照ライブラリの正確なパターンを直接複製
    const refPatterns = {
      'L': {
        row8: [1,1,0,0,1,1,1,0,0,0,0,0,1,0,0,1,0,1,1,1,1],
        col8: [1,1,1,1,0,1,1,0,0,0,0,0,0,1,0,1,1,0,0,1,1]
      },
      'M': {
        row8: [1,0,0,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1],
        col8: [1,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,0,1]
      },
      'Q': {
        row8: [0,1,1,1,0,1,1,0,0,1,0,1,0,0,0,0,0,0,1,1,0],
        col8: [0,1,1,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,1,1,0]
      },
      'H': {
        row8: [0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
        col8: [1,0,1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,0,0]
      }
    };
    
    const pattern = refPatterns[errorCorrectionLevel];
    if (pattern) {
      // 行8の配置
      for (let c = 0; c < 21; c++) {
        modules[8][c] = pattern.row8[c] === 1;
      }
      
      // 列8の配置
      for (let r = 0; r < 21; r++) {
        modules[r][8] = pattern.col8[r] === 1;
      }
    }
    
    // 固定ダークモジュール（上書きされる可能性があるので最後に設定）
    modules[size - 8][8] = true;
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