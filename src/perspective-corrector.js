/**
 * Perspective Corrector for QR Code
 * Handles perspective transformation to correct QR code orientation and distortion
 */

import { QRSpecUtils } from './qr-spec-utils.js';
import { ErrorFactory, QRCodeDecodeError } from './errors.js';
import { bilinearInterpolation } from './image-utils.js';

export class PerspectiveCorrector {
  constructor(options = {}) {
    this.options = {
      outputSize: null, // Auto-calculate if null
      interpolation: 'bilinear',
      qualityCheck: true,
      ...options
    };
  }

  /**
   * Apply perspective correction to extract QR code matrix
   * Takes finder patterns and returns corrected binary matrix
   */
  correctPerspective(binaryMatrix, finderPatterns) {
    try {
      // Validate inputs
      this.validateInputs(binaryMatrix, finderPatterns);
      
      // Order patterns: top-left, top-right, bottom-left
      const [topLeft, topRight, bottomLeft] = finderPatterns;
      
      // Calculate QR code dimensions and module size
      const dimensions = this.calculateDimensions(topLeft, topRight, bottomLeft);
      
      // Estimate bottom-right corner
      const bottomRight = this.estimateBottomRight(topLeft, topRight, bottomLeft);
      
      // Define source corners (from image) and destination corners (normalized QR)
      const sourceCorners = [topLeft, topRight, bottomLeft, bottomRight];
      const destinationCorners = this.getDestinationCorners(dimensions.size);
      
      // Calculate transformation matrix
      const transformMatrix = this.calculateTransformMatrix(sourceCorners, destinationCorners);
      
      // Apply transformation
      const correctedMatrix = this.applyTransformation(
        binaryMatrix, 
        transformMatrix, 
        dimensions.size
      );
      
      // Validate quality if enabled
      if (this.options.qualityCheck) {
        this.validateQuality(correctedMatrix, dimensions);
      }
      
      return {
        matrix: correctedMatrix,
        dimensions: dimensions,
        transformation: transformMatrix,
        corners: { source: sourceCorners, destination: destinationCorners }
      };
      
    } catch (error) {
      if (error instanceof QRCodeDecodeError) {
        throw error;
      }
      
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.PERSPECTIVE_CORRECTION_FAILED,
        `Perspective correction failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Validate inputs for perspective correction
   */
  validateInputs(binaryMatrix, finderPatterns) {
    if (!binaryMatrix || !Array.isArray(binaryMatrix) || binaryMatrix.length === 0) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.INVALID_IMAGE,
        'Invalid binary matrix for perspective correction'
      );
    }

    if (!finderPatterns || finderPatterns.length !== 3) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND,
        `Need exactly 3 finder patterns, got ${finderPatterns?.length || 0}`
      );
    }

    // Validate each pattern has required properties
    for (let i = 0; i < finderPatterns.length; i++) {
      const pattern = finderPatterns[i];
      if (typeof pattern.x !== 'number' || typeof pattern.y !== 'number') {
        throw ErrorFactory.createDecodeError(
          QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND,
          `Invalid finder pattern ${i}: missing coordinates`
        );
      }
    }
  }

  /**
   * Calculate QR code dimensions from finder patterns
   */
  calculateDimensions(topLeft, topRight, bottomLeft) {
    // Calculate average module size from finder pattern distances
    const horizontalDistance = Math.sqrt(
      Math.pow(topRight.x - topLeft.x, 2) + Math.pow(topRight.y - topLeft.y, 2)
    );
    const verticalDistance = Math.sqrt(
      Math.pow(bottomLeft.x - topLeft.x, 2) + Math.pow(bottomLeft.y - topLeft.y, 2)
    );
    
    // Each side spans from center of one finder to center of another
    // Finder patterns are at modules (3.5, 3.5), so distance between centers
    // represents modules from 3.5 to (size - 3.5) = size - 7
    const averageDistance = (horizontalDistance + verticalDistance) / 2;
    const moduleCount = averageDistance / (this.getModulesFromDistance(averageDistance));
    
    // Estimate QR version from module count
    const estimatedSize = Math.round(moduleCount);
    const version = this.estimateVersion(estimatedSize);
    const actualSize = QRSpecUtils.calculateQRSize(version);
    
    // Calculate actual module size
    const moduleSize = averageDistance / (actualSize - 7);
    
    return {
      version: version,
      size: actualSize,
      moduleSize: moduleSize,
      estimatedSize: estimatedSize
    };
  }

  /**
   * Get expected module count from distance
   */
  getModulesFromDistance(distance) {
    // This is an estimation - in practice we'd have a lookup table
    // For now, assume minimum QR size (21) and work from there
    const minDistance = 14; // 21 - 7 modules between finder centers
    return Math.max(14, Math.round(distance / 5)); // Rough estimation
  }

  /**
   * Estimate QR version from size
   */
  estimateVersion(size) {
    // QR size formula: 21 + (version - 1) * 4
    // Solve for version: version = (size - 21) / 4 + 1
    const version = Math.round((size - 21) / 4 + 1);
    return Math.max(1, Math.min(40, version));
  }

  /**
   * Estimate bottom-right corner position
   */
  estimateBottomRight(topLeft, topRight, bottomLeft) {
    // Bottom-right = topRight + bottomLeft - topLeft (parallelogram)
    return {
      x: topRight.x + bottomLeft.x - topLeft.x,
      y: topRight.y + bottomLeft.y - topLeft.y
    };
  }

  /**
   * Get destination corners for normalized QR code
   */
  getDestinationCorners(size) {
    const margin = 0; // No margin in destination
    return [
      { x: margin, y: margin },                    // top-left
      { x: size - margin, y: margin },             // top-right  
      { x: margin, y: size - margin },             // bottom-left
      { x: size - margin, y: size - margin }       // bottom-right
    ];
  }

  /**
   * Calculate perspective transformation matrix
   * Uses homogeneous coordinates for projective transformation
   */
  calculateTransformMatrix(sourceCorners, destinationCorners) {
    // Set up system of equations for perspective transformation
    // [x' y' 1] = [x y 1] * H where H is 3x3 transformation matrix
    
    const src = sourceCorners;
    const dst = destinationCorners;
    
    // Create matrix equation system Ax = b
    const A = [];
    const b = [];
    
    for (let i = 0; i < 4; i++) {
      // For x' coordinate
      A.push([
        src[i].x, src[i].y, 1, 0, 0, 0, 
        -dst[i].x * src[i].x, -dst[i].x * src[i].y
      ]);
      b.push(dst[i].x);
      
      // For y' coordinate  
      A.push([
        0, 0, 0, src[i].x, src[i].y, 1,
        -dst[i].y * src[i].x, -dst[i].y * src[i].y
      ]);
      b.push(dst[i].y);
    }
    
    // Solve for transformation parameters using least squares
    const solution = this.solveLeastSquares(A, b);
    
    // Construct 3x3 transformation matrix
    return [
      [solution[0], solution[1], solution[2]],
      [solution[3], solution[4], solution[5]],
      [solution[6], solution[7], 1]
    ];
  }

  /**
   * Solve least squares system Ax = b
   * Simplified implementation - in production would use proper linear algebra library
   */
  solveLeastSquares(A, b) {
    // This is a simplified Gaussian elimination
    // In production, use a proper linear algebra library like ml-matrix
    
    const n = A.length;
    const m = A[0].length;
    
    // Create augmented matrix [A|b]
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < Math.min(n, m); i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        if (augmented[i][i] !== 0) {
          const factor = augmented[k][i] / augmented[i][i];
          for (let j = i; j <= m; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Back substitution
    const solution = new Array(m).fill(0);
    for (let i = Math.min(n, m) - 1; i >= 0; i--) {
      solution[i] = augmented[i][m];
      for (let j = i + 1; j < m; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      if (augmented[i][i] !== 0) {
        solution[i] /= augmented[i][i];
      }
    }
    
    return solution;
  }

  /**
   * Apply transformation to create corrected matrix
   */
  applyTransformation(sourceMatrix, transformMatrix, outputSize) {
    const correctedMatrix = Array(outputSize).fill().map(() => Array(outputSize).fill(0));
    
    for (let y = 0; y < outputSize; y++) {
      for (let x = 0; x < outputSize; x++) {
        // Apply inverse transformation to find source coordinates
        const sourceCoords = this.applyInverseTransform(transformMatrix, x, y);
        
        // Sample from source matrix using interpolation
        const value = this.sampleMatrix(sourceMatrix, sourceCoords.x, sourceCoords.y);
        correctedMatrix[y][x] = value;
      }
    }
    
    return correctedMatrix;
  }

  /**
   * Apply inverse transformation to get source coordinates
   */
  applyInverseTransform(matrix, x, y) {
    // For projective transformation: [x' y' w'] = [x y 1] * H
    // We need inverse: [x y 1] = [x' y' 1] * H^-1
    
    // Calculate using forward transformation (simplified approach)
    // In production, would compute actual matrix inverse
    
    const denominator = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
    
    if (Math.abs(denominator) < 1e-10) {
      return { x: 0, y: 0 }; // Avoid division by zero
    }
    
    const sourceX = (matrix[0][0] * x + matrix[0][1] * y + matrix[0][2]) / denominator;
    const sourceY = (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]) / denominator;
    
    return { x: sourceX, y: sourceY };
  }

  /**
   * Sample value from matrix with interpolation
   */
  sampleMatrix(matrix, x, y) {
    const height = matrix.length;
    const width = matrix[0].length;
    
    // Bounds checking
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return 0; // Default to light module outside bounds
    }
    
    if (this.options.interpolation === 'bilinear') {
      return bilinearInterpolation(matrix, x, y) > 0.5 ? 1 : 0;
    } else {
      // Nearest neighbor (default)
      return matrix[Math.round(y)][Math.round(x)];
    }
  }

  /**
   * Validate quality of corrected matrix
   */
  validateQuality(correctedMatrix, dimensions) {
    const size = correctedMatrix.length;
    
    // Check if finder patterns are present at expected locations
    const finderChecks = [
      this.checkFinderPattern(correctedMatrix, 0, 0),           // top-left
      this.checkFinderPattern(correctedMatrix, size - 7, 0),   // top-right
      this.checkFinderPattern(correctedMatrix, 0, size - 7)    // bottom-left
    ];
    
    const validFinders = finderChecks.filter(Boolean).length;
    
    if (validFinders < 2) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.PERSPECTIVE_CORRECTION_FAILED,
        `Quality check failed: only ${validFinders}/3 finder patterns detected after correction`,
        { validFinders, dimensions }
      );
    }
    
    // Check timing patterns
    if (!this.checkTimingPatterns(correctedMatrix)) {
      throw ErrorFactory.createDecodeError(
        QRCodeDecodeError.CODES.PERSPECTIVE_CORRECTION_FAILED,
        'Quality check failed: timing patterns not detected after correction',
        { dimensions }
      );
    }
  }

  /**
   * Check if finder pattern exists at given position
   */
  checkFinderPattern(matrix, startX, startY) {
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

    return total > 0 && (matches / total) >= 0.7; // 70% match threshold
  }

  /**
   * Check timing patterns (row 6 and column 6)
   */
  checkTimingPatterns(matrix) {
    const size = matrix.length;
    let correctTiming = 0;
    let totalTiming = 0;
    
    // Check horizontal timing pattern (row 6)
    for (let x = 8; x < size - 8; x++) {
      const expected = (x % 2) === 0 ? 1 : 0;
      if (matrix[6][x] === expected) correctTiming++;
      totalTiming++;
    }
    
    // Check vertical timing pattern (column 6)
    for (let y = 8; y < size - 8; y++) {
      const expected = (y % 2) === 0 ? 1 : 0;
      if (matrix[y][6] === expected) correctTiming++;
      totalTiming++;
    }
    
    return totalTiming > 0 && (correctTiming / totalTiming) >= 0.7;
  }

  /**
   * Get correction statistics for debugging
   */
  getCorrectionStatistics(result) {
    return {
      dimensions: result.dimensions,
      transformationMatrix: result.transformation,
      corners: result.corners,
      qualityMetrics: {
        finderPatternsDetected: [
          this.checkFinderPattern(result.matrix, 0, 0),
          this.checkFinderPattern(result.matrix, result.dimensions.size - 7, 0),
          this.checkFinderPattern(result.matrix, 0, result.dimensions.size - 7)
        ].filter(Boolean).length,
        timingPatternsValid: this.checkTimingPatterns(result.matrix)
      }
    };
  }
}