import { calculateDistance } from './utils.js';
import { base64ToUint8Array } from './base64-utils.js';
import { 
  parseImageFromBase64, 
  adaptiveThreshold,
  applyPerspectiveTransform 
} from './image-utils.js';
import { FINDER_PATTERN, MASK_PATTERNS, ALPHANUMERIC_CHARS } from './constants.js';
import { getFormatInfo } from './format-info.js';

// Constants for decoding
const ADAPTIVE_THRESHOLD_BLOCK_SIZE = 11;
const ADAPTIVE_THRESHOLD_C = 2;
const MIN_FINDER_PATTERN_DISTANCE = 10;

export class QRCodeDecoder {
  constructor() {
    this.modes = {
      1: 'NUMERIC',
      2: 'ALPHANUMERIC', 
      4: 'BYTE',
      8: 'KANJI'
    };
    
    // Backward compatibility for tests
    this.patterns = {
      FINDER: FINDER_PATTERN
    };
  }
  
  async decode(data, options = {}) {
    try {
      const imageData = await this.preprocessImage(data, options);
      const matrix = this.extractMatrix(imageData);
      const qrData = this.decodeMatrix(matrix);
      return qrData;
    } catch (error) {
      return null;
    }
  }
  
  async preprocessImage(data, options) {
    if (data instanceof ImageData) {
      return data;
    }
    
    if (typeof data === 'string' && data.startsWith('data:')) {
      return await this.decodeBase64Image(data);
    }
    
    if (data instanceof Uint8Array) {
      const { width, height } = options;
      if (!width || !height) {
        throw new Error('Width and height required for Uint8Array data');
      }
      
      if (data.length === width * height) {
        const rgbaData = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < data.length; i++) {
          const rgbaIndex = i * 4;
          const gray = data[i];
          rgbaData[rgbaIndex] = gray;     // R
          rgbaData[rgbaIndex + 1] = gray; // G
          rgbaData[rgbaIndex + 2] = gray; // B
          rgbaData[rgbaIndex + 3] = 255;  // A
        }
        return new ImageData(rgbaData, width, height);
      } else if (data.length === width * height * 4) {
        return new ImageData(new Uint8ClampedArray(data), width, height);
      } else {
        throw new Error('Invalid Uint8Array length for given dimensions');
      }
    }
    
    throw new Error('Unsupported data format');
  }
  
  async decodeBase64Image(base64Data) {
    if (typeof document !== 'undefined') {
      return await parseImageFromBase64(base64Data);
    } else {
      base64ToUint8Array(base64Data.split(',')[1] || base64Data);
      throw new Error('Server-side image parsing not implemented. Use Uint8Array with dimensions instead.');
    }
  }
  
  extractMatrix(imageData) {
    return adaptiveThreshold(imageData, ADAPTIVE_THRESHOLD_BLOCK_SIZE, ADAPTIVE_THRESHOLD_C);
  }
  
  decodeMatrix(matrix) {
    try {
      const finderPatterns = this.findFinderPatterns(matrix);
      if (finderPatterns.length < 3) {
        return null;
      }
      
      const corners = this.calculateCorners(finderPatterns);
      const correctedMatrix = this.correctPerspective(matrix, corners);
      const formatInfo = this.readFormatInfo(correctedMatrix);
      const data = this.readData(correctedMatrix, formatInfo);
      
      return data;
    } catch (error) {
      return null;
    }
  }
  
  findFinderPatterns(matrix) {
    const patterns = [];
    const height = matrix.length;
    const width = matrix[0].length;
    
    for (let y = 0; y <= height - 7; y++) {
      for (let x = 0; x <= width - 7; x++) {
        if (this.isFinderPattern(matrix, x, y)) {
          patterns.push({ x: x + 3, y: y + 3 });
        }
      }
    }
    
    return this.filterFinderPatterns(patterns);
  }
  
  isFinderPattern(matrix, startX, startY) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        if (matrix[startY + dy][startX + dx] !== FINDER_PATTERN[dy][dx]) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  filterFinderPatterns(patterns) {
    const filtered = [];
    const minDistance = MIN_FINDER_PATTERN_DISTANCE;
    
    for (const pattern of patterns) {
      let isDuplicate = false;
      for (const existing of filtered) {
        if (calculateDistance(pattern, existing) < minDistance) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        filtered.push(pattern);
      }
    }
    
    return filtered.slice(0, 3);
  }
  
  calculateCorners(finderPatterns) {
    if (finderPatterns.length !== 3) {
      throw new Error('Expected 3 finder patterns');
    }
    
    const [pattern1, pattern2, pattern3] = finderPatterns;
    
    const distance12 = calculateDistance(pattern1, pattern2);
    const distance13 = calculateDistance(pattern1, pattern3);
    const distance23 = calculateDistance(pattern2, pattern3);
    
    let topLeft, topRight, bottomLeft;
    
    if (distance12 > distance13 && distance12 > distance23) {
      topLeft = pattern3;
      topRight = pattern1.x > pattern2.x ? pattern1 : pattern2;
      bottomLeft = pattern1.x > pattern2.x ? pattern2 : pattern1;
    } else if (distance13 > distance23) {
      topLeft = pattern2;
      topRight = pattern1.x > pattern3.x ? pattern1 : pattern3;
      bottomLeft = pattern1.x > pattern3.x ? pattern3 : pattern1;
    } else {
      topLeft = pattern1;
      topRight = pattern2.x > pattern3.x ? pattern2 : pattern3;
      bottomLeft = pattern2.x > pattern3.x ? pattern3 : pattern2;
    }
    
    const bottomRight = {
      x: topRight.x + (bottomLeft.x - topLeft.x),
      y: bottomLeft.y + (topRight.y - topLeft.y)
    };
    
    return [topLeft, topRight, bottomLeft, bottomRight];
  }
  
  correctPerspective(matrix, corners) {
    const qrSize = this.estimateQRSize(corners);
    return applyPerspectiveTransform(matrix, corners, qrSize);
  }
  
  estimateQRSize(corners) {
    const [topLeft, topRight, bottomLeft] = corners;
    const width = calculateDistance(topLeft, topRight);
    const height = calculateDistance(topLeft, bottomLeft);
    const averageSize = (width + height) / 2;
    
    if (averageSize < 50) return 21;
    if (averageSize < 100) return 25; 
    if (averageSize < 150) return 29;
    return 33;
  }
  
  readFormatInfo(matrix) {
    let formatBits = 0;
    
    for (let i = 0; i < 15; i++) {
      let currentBit = 0;
      
      if (i < 6) {
        currentBit = matrix[8][i];
      } else if (i < 8) {
        currentBit = matrix[8][i + 1];
      } else {
        currentBit = matrix[7 - (i - 8)][8];
      }
      
      formatBits |= (currentBit << i);
    }
    
    for (const level of ['L', 'M', 'Q', 'H']) {
      for (let maskIndex = 0; maskIndex < 8; maskIndex++) {
        if (getFormatInfo(level, maskIndex) === formatBits) {
          return { errorCorrectionLevel: level, maskPattern: maskIndex };
        }
      }
    }
    
    return { errorCorrectionLevel: 'M', maskPattern: 0 };
  }
  
  readData(matrix, formatInfo) {
    const size = matrix.length;
    let dataBits = '';
    let readingUpward = true;
    
    for (let columnPair = size - 1; columnPair >= 1; columnPair -= 2) {
      if (columnPair === 6) columnPair--;
      
      for (let rowOffset = 0; rowOffset < size; rowOffset++) {
        const row = readingUpward ? size - 1 - rowOffset : rowOffset;
        
        for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
          const currentCol = columnPair - columnOffset;
          
          if (!this.isReservedModule(row, currentCol, size)) {
            const moduleBit = matrix[row][currentCol];
            const unmaskedBit = this.applyMask(moduleBit, row, currentCol, formatInfo.maskPattern);
            dataBits += unmaskedBit ? '1' : '0';
          }
        }
      }
      
      readingUpward = !readingUpward;
    }
    
    return this.decodeBits(dataBits);
  }
  
  isReservedModule(row, col, size) {
    if (row < 0 || row >= size || col < 0 || col >= size) return true;
    
    if ((row <= 8 && col <= 8) || 
        (row <= 8 && col >= size - 8) || 
        (row >= size - 8 && col <= 8)) {
      return true;
    }
    
    if (row === 6 || col === 6) return true;
    
    return false;
  }
  
  applyMask(moduleBit, row, col, maskPattern) {
    if (maskPattern >= 0 && maskPattern < MASK_PATTERNS.length) {
      const maskValue = MASK_PATTERNS[maskPattern](row, col);
      return moduleBit ^ maskValue;
    }
    return moduleBit;
  }
  
  decodeBits(binaryData) {
    if (binaryData.length < 4) return '';
    
    const encodingMode = parseInt(binaryData.substring(0, 4), 2);
    if (!this.modes[encodingMode]) return '';
    
    const modeType = this.modes[encodingMode];
    const characterCountBits = this.getCharacterCountLength(encodingMode, 1);
    
    if (binaryData.length < 4 + characterCountBits) return '';
    
    const dataLength = parseInt(binaryData.substring(4, 4 + characterCountBits), 2);
    const encodedData = binaryData.substring(4 + characterCountBits);
    
    switch (modeType) {
      case 'NUMERIC':
        return this.decodeNumeric(encodedData, dataLength);
      case 'ALPHANUMERIC':
        return this.decodeAlphanumeric(encodedData, dataLength);
      case 'BYTE':
        return this.decodeByte(encodedData, dataLength);
      default:
        return '';
    }
  }
  
  getCharacterCountLength(encodingMode, qrVersion) {
    if (encodingMode === 1) { // NUMERIC
      return qrVersion <= 9 ? 10 : qrVersion <= 26 ? 12 : 14;
    } else if (encodingMode === 2) { // ALPHANUMERIC
      return qrVersion <= 9 ? 9 : qrVersion <= 26 ? 11 : 13;
    } else { // BYTE
      return qrVersion <= 9 ? 8 : qrVersion <= 26 ? 16 : 16;
    }
  }
  
  decodeNumeric(binaryData, characterCount) {
    let decodedText = '';
    
    for (let charIndex = 0; charIndex < characterCount; charIndex += 3) {
      const remainingChars = Math.min(3, characterCount - charIndex);
      const requiredBits = remainingChars === 3 ? 10 : remainingChars === 2 ? 7 : 4;
      
      if (binaryData.length < requiredBits) break;
      
      const numericValue = parseInt(binaryData.substring(0, requiredBits), 2);
      decodedText += numericValue.toString().padStart(remainingChars, '0');
      binaryData = binaryData.substring(requiredBits);
    }
    
    return decodedText.substring(0, characterCount);
  }
  
  decodeAlphanumeric(binaryData, characterCount) {
    let decodedText = '';
    
    for (let charIndex = 0; charIndex < characterCount; charIndex += 2) {
      const remainingChars = Math.min(2, characterCount - charIndex);
      
      if (remainingChars === 2) {
        if (binaryData.length < 11) break;
        const encodedValue = parseInt(binaryData.substring(0, 11), 2);
        decodedText += ALPHANUMERIC_CHARS[Math.floor(encodedValue / 45)] + ALPHANUMERIC_CHARS[encodedValue % 45];
        binaryData = binaryData.substring(11);
      } else {
        if (binaryData.length < 6) break;
        const encodedValue = parseInt(binaryData.substring(0, 6), 2);
        decodedText += ALPHANUMERIC_CHARS[encodedValue];
        binaryData = binaryData.substring(6);
      }
    }
    
    return decodedText.substring(0, characterCount);
  }
  
  decodeByte(binaryData, byteCount) {
    let decodedText = '';
    
    for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
      if (binaryData.length < 8) break;
      const byteValue = parseInt(binaryData.substring(0, 8), 2);
      decodedText += String.fromCharCode(byteValue);
      binaryData = binaryData.substring(8);
    }
    
    return decodedText;
  }
}