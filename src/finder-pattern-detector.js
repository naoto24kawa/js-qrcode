/**
 * Finder Pattern Detector for QR Code
 * Detects and validates the three finder patterns that define QR code corners
 */

import { ErrorFactory, QRCodeDecodeError } from './errors.js';

export class FinderPatternDetector {
  constructor(options = {}) {
    this.options = {
      toleranceRatio: 0.5,
      minModuleSize: 3,
      maxModuleSize: 50,
      ...options
    };
  }

  /**
   * Find all three finder patterns in the binary matrix
   * Returns array of pattern objects with center coordinates and module size
   */
  findFinderPatterns(matrix) {
    try {
      const height = matrix.length;
      const width = matrix[0].length;
      const patterns = [];

      // Scan matrix for finder pattern signatures
      for (let y = 0; y < height - 6; y++) {
        for (let x = 0; x < width - 6; x++) {
          const pattern = this.detectPatternAt(matrix, x, y);
          if (pattern) {
            patterns.push(pattern);
          }
        }
      }

      // Filter and validate patterns
      const validPatterns = this.filterValidPatterns(patterns);
      
      if (validPatterns.length < 3) {
        throw ErrorFactory.createDecodeError(
          QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND,
          `Only ${validPatterns.length} finder patterns found, need 3`,
          { 
            foundPatterns: validPatterns.length,
            totalCandidates: patterns.length,
            matrixSize: `${width}x${height}`
          }
        );
      }

      // Return best 3 patterns
      return this.selectBestPatterns(validPatterns);

    } catch (error) {
      if (error instanceof QRCodeDecodeError) {
        throw error;
      }
      
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND,
        `Finder pattern detection failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Detect finder pattern at specific position
   * Finder pattern has ratio 1:1:3:1:1 (dark:light:dark:light:dark)
   */
  detectPatternAt(matrix, startX, startY) {
    // Check horizontal line first for pattern signature
    const horizontalRatios = this.scanLine(matrix, startX, startY, 1, 0, 7);
    if (!this.isValidFinderRatio(horizontalRatios)) {
      return null;
    }

    // Check vertical line for confirmation
    const verticalRatios = this.scanLine(matrix, startX, startY, 0, 1, 7);
    if (!this.isValidFinderRatio(verticalRatios)) {
      return null;
    }

    // Calculate pattern center and module size
    const moduleSize = (horizontalRatios.reduce((a, b) => a + b, 0) + 
                       verticalRatios.reduce((a, b) => a + b, 0)) / 14;

    // Verify the pattern is properly formed
    if (!this.verifyPattern(matrix, startX, startY, moduleSize)) {
      return null;
    }

    return {
      x: startX + 3.5, // Center of 7x7 pattern
      y: startY + 3.5,
      moduleSize: moduleSize,
      confidence: this.calculateConfidence(horizontalRatios, verticalRatios)
    };
  }

  /**
   * Scan line for pattern ratios
   */
  scanLine(matrix, startX, startY, deltaX, deltaY, length) {
    const ratios = [];
    let currentColor = matrix[startY][startX];
    let currentCount = 1;

    for (let i = 1; i < length; i++) {
      const x = startX + i * deltaX;
      const y = startY + i * deltaY;
      
      if (y >= matrix.length || x >= matrix[0].length) {
        break;
      }

      const color = matrix[y][x];
      if (color === currentColor) {
        currentCount++;
      } else {
        ratios.push(currentCount);
        currentColor = color;
        currentCount = 1;
      }
    }
    
    ratios.push(currentCount);
    return ratios;
  }

  /**
   * Check if ratios match finder pattern (1:1:3:1:1)
   */
  isValidFinderRatio(ratios) {
    if (ratios.length !== 5) {
      return false;
    }

    // Calculate total module count
    const totalModules = ratios.reduce((a, b) => a + b, 0);
    const moduleSize = totalModules / 7; // Expected: 7 modules total

    // Check each ratio against expected (allowing for tolerance)
    const expectedRatios = [1, 1, 3, 1, 1];
    const tolerance = this.options.toleranceRatio;

    for (let i = 0; i < 5; i++) {
      const expected = expectedRatios[i] * moduleSize;
      const actual = ratios[i];
      const diff = Math.abs(actual - expected) / expected;
      
      if (diff > tolerance) {
        return false;
      }
    }

    // Check module size is reasonable
    return moduleSize >= this.options.minModuleSize && 
           moduleSize <= this.options.maxModuleSize;
  }

  /**
   * Verify the full 7x7 pattern structure
   */
  verifyPattern(matrix, startX, startY, moduleSize) {
    const expectedPattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ];

    let matches = 0;
    let total = 0;

    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const y = startY + dy;
        const x = startX + dx;
        
        if (y < matrix.length && x < matrix[0].length) {
          if (matrix[y][x] === expectedPattern[dy][dx]) {
            matches++;
          }
          total++;
        }
      }
    }

    // Require at least 80% match
    return (matches / total) >= 0.8;
  }

  /**
   * Calculate confidence score for pattern
   */
  calculateConfidence(horizontalRatios, verticalRatios) {
    const idealRatios = [1, 1, 3, 1, 1];
    
    let totalDeviation = 0;
    const totalModulesH = horizontalRatios.reduce((a, b) => a + b, 0) / 7;
    const totalModulesV = verticalRatios.reduce((a, b) => a + b, 0) / 7;
    
    // Calculate deviation from ideal ratios
    for (let i = 0; i < 5; i++) {
      const expectedH = idealRatios[i] * totalModulesH;
      const expectedV = idealRatios[i] * totalModulesV;
      
      totalDeviation += Math.abs(horizontalRatios[i] - expectedH) / expectedH;
      totalDeviation += Math.abs(verticalRatios[i] - expectedV) / expectedV;
    }
    
    // Convert deviation to confidence (0-1 scale)
    return Math.max(0, 1 - (totalDeviation / 10));
  }

  /**
   * Filter out overlapping and invalid patterns
   */
  filterValidPatterns(patterns) {
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    const filtered = [];
    const minDistance = 10; // Minimum distance between pattern centers
    
    for (const pattern of patterns) {
      let tooClose = false;
      
      for (const existing of filtered) {
        const distance = Math.sqrt(
          Math.pow(pattern.x - existing.x, 2) + 
          Math.pow(pattern.y - existing.y, 2)
        );
        
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        filtered.push(pattern);
      }
    }
    
    return filtered;
  }

  /**
   * Select the best 3 patterns that form a valid QR code structure
   */
  selectBestPatterns(patterns) {
    if (patterns.length === 3) {
      return this.orderPatterns(patterns);
    }
    
    // Find the best combination of 3 patterns
    let bestScore = -1;
    let bestCombination = null;
    
    for (let i = 0; i < patterns.length - 2; i++) {
      for (let j = i + 1; j < patterns.length - 1; j++) {
        for (let k = j + 1; k < patterns.length; k++) {
          const combination = [patterns[i], patterns[j], patterns[k]];
          const score = this.scorePatternTriangle(combination);
          
          if (score > bestScore) {
            bestScore = score;
            bestCombination = combination;
          }
        }
      }
    }
    
    if (!bestCombination) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND,
        'Cannot find valid combination of 3 finder patterns',
        { availablePatterns: patterns.length }
      );
    }
    
    return this.orderPatterns(bestCombination);
  }

  /**
   * Score a triangle of patterns based on geometry
   */
  scorePatternTriangle(patterns) {
    // Calculate distances between patterns
    const d01 = this.distance(patterns[0], patterns[1]);
    const d02 = this.distance(patterns[0], patterns[2]);
    const d12 = this.distance(patterns[1], patterns[2]);
    
    // QR codes should have roughly equal distances between opposite corners
    const maxDistance = Math.max(d01, d02, d12);
    const minDistance = Math.min(d01, d02, d12);
    
    // Check if it forms a reasonable right triangle (QR shape)
    const distances = [d01, d02, d12].sort((a, b) => a - b);
    const rightTriangleScore = Math.abs(
      distances[2] * distances[2] - (distances[0] * distances[0] + distances[1] * distances[1])
    ) / (distances[2] * distances[2]);
    
    // Combine confidence and geometry scores
    const confidenceScore = patterns.reduce((sum, p) => sum + p.confidence, 0) / 3;
    const geometryScore = 1 - rightTriangleScore;
    const sizeConsistency = minDistance / maxDistance;
    
    return confidenceScore * 0.5 + geometryScore * 0.3 + sizeConsistency * 0.2;
  }

  /**
   * Calculate distance between two patterns
   */
  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * Order patterns: top-left, top-right, bottom-left
   */
  orderPatterns(patterns) {
    // Find top-left (minimum x + y)
    let topLeft = patterns[0];
    let topLeftIndex = 0;
    
    for (let i = 1; i < patterns.length; i++) {
      if (patterns[i].x + patterns[i].y < topLeft.x + topLeft.y) {
        topLeft = patterns[i];
        topLeftIndex = i;
      }
    }
    
    // Remove top-left from remaining patterns
    const remaining = patterns.filter((_, i) => i !== topLeftIndex);
    
    // Determine top-right and bottom-left based on position relative to top-left
    let topRight, bottomLeft;
    
    if (remaining[0].x > remaining[1].x) {
      topRight = remaining[0];
      bottomLeft = remaining[1];
    } else {
      topRight = remaining[1];
      bottomLeft = remaining[0];
    }
    
    return [topLeft, topRight, bottomLeft];
  }

  /**
   * Get detection statistics for debugging
   */
  getDetectionStatistics(patterns) {
    if (patterns.length !== 3) {
      return { error: 'Invalid pattern count', patternCount: patterns.length };
    }
    
    const [topLeft, topRight, bottomLeft] = patterns;
    
    return {
      patternCount: patterns.length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / 3,
      averageModuleSize: patterns.reduce((sum, p) => sum + p.moduleSize, 0) / 3,
      distances: {
        topLeftToTopRight: this.distance(topLeft, topRight),
        topLeftToBottomLeft: this.distance(topLeft, bottomLeft),
        topRightToBottomLeft: this.distance(topRight, bottomLeft)
      },
      geometry: {
        width: topRight.x - topLeft.x,
        height: bottomLeft.y - topLeft.y,
        angle: Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x) * 180 / Math.PI
      }
    };
  }
}