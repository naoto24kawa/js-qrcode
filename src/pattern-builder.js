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
    modules[4 * version + 9][8] = true;
  }

  addFormatInfo(modules, size, errorCorrectionLevel, maskPattern) {
    const formatBits = getFormatInfo(errorCorrectionLevel, maskPattern);
    
    // Place format information in two locations around the finder patterns
    for (let i = 0; i < 15; i++) {
      const bit = (formatBits >> i) & 1;
      const isDark = bit === 1;
      
      // First location: around top-left and top-right finder patterns
      if (i < 6) {
        modules[8][i] = isDark;
        modules[size - 1 - i][8] = isDark;
      } else if (i < 8) {
        modules[8][i + 1] = isDark;
        modules[size - 7 + i - 6][8] = isDark;
      } else {
        modules[7 - (i - 8)][8] = isDark;
        modules[8][size - 15 + i] = isDark;
      }
    }
  }

  addAlignmentPatterns(modules, version) {
    if (version < 2) return;
    
    const positions = this.getAlignmentPatternPositions(version);
    
    positions.forEach(([centerRow, centerCol]) => {
      this.placeAlignmentPattern(modules, centerRow, centerCol);
    });
  }

  placeAlignmentPattern(modules, centerRow, centerCol) {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        
        if (modules[row]?.[col] !== undefined) {
          const isEdge = Math.abs(i) === 2 || Math.abs(j) === 2;
          const isCenter = i === 0 && j === 0;
          modules[row][col] = isEdge || isCenter;
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
    const centerMap = {
      1: [],
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30]
    };
    
    return centerMap[version] || [6, 18, 30];
  }

  isFinderPatternArea(row, col, size = 25) {
    return (row <= 8 && col <= 8) || 
           (row <= 8 && col >= size - 8) || 
           (row >= size - 8 && col <= 8);
  }
}