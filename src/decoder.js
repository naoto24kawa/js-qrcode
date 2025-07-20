import { 
  base64ToUint8Array, 
  parseImageFromBase64, 
  adaptiveThreshold,
  calculateDistance,
  applyPerspectiveTransform 
} from './utils.js';
import { FINDER_PATTERN, FORMAT_INFO, MASK_PATTERNS, ALPHANUMERIC_CHARS } from './constants.js';

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
    
    const [p1, p2, p3] = finderPatterns;
    
    const d12 = calculateDistance(p1, p2);
    const d13 = calculateDistance(p1, p3);
    const d23 = calculateDistance(p2, p3);
    
    let topLeft, topRight, bottomLeft;
    
    if (d12 > d13 && d12 > d23) {
      topLeft = p3;
      topRight = p1.x > p2.x ? p1 : p2;
      bottomLeft = p1.x > p2.x ? p2 : p1;
    } else if (d13 > d23) {
      topLeft = p2;
      topRight = p1.x > p3.x ? p1 : p3;
      bottomLeft = p1.x > p3.x ? p3 : p1;
    } else {
      topLeft = p1;
      topRight = p2.x > p3.x ? p2 : p3;
      bottomLeft = p2.x > p3.x ? p3 : p2;
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
    const [tl, tr, bl] = corners;
    const width = calculateDistance(tl, tr);
    const height = calculateDistance(tl, bl);
    const avgSize = (width + height) / 2;
    
    if (avgSize < 50) return 21;
    if (avgSize < 100) return 25; 
    if (avgSize < 150) return 29;
    return 33;
  }
  
  readFormatInfo(matrix) {
    let formatBits = 0;
    
    for (let i = 0; i < 15; i++) {
      let bit = 0;
      
      if (i < 6) {
        bit = matrix[8][i];
      } else if (i < 8) {
        bit = matrix[8][i + 1];
      } else {
        bit = matrix[7 - (i - 8)][8];
      }
      
      formatBits |= (bit << i);
    }
    
    for (const level of ['L', 'M', 'Q', 'H']) {
      for (let mask = 0; mask < 8; mask++) {
        if (FORMAT_INFO[level][mask] === formatBits) {
          return { errorCorrectionLevel: level, maskPattern: mask };
        }
      }
    }
    
    return { errorCorrectionLevel: 'M', maskPattern: 0 };
  }
  
  readData(matrix, formatInfo) {
    const size = matrix.length;
    let bits = '';
    let up = true;
    
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col--;
      
      for (let count = 0; count < size; count++) {
        const row = up ? size - 1 - count : count;
        
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          
          if (!this.isReservedModule(row, currentCol, size)) {
            const bit = matrix[row][currentCol];
            const maskedBit = this.applyMask(bit, row, currentCol, formatInfo.maskPattern);
            bits += maskedBit ? '1' : '0';
          }
        }
      }
      
      up = !up;
    }
    
    return this.decodeBits(bits);
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
  
  applyMask(bit, row, col, maskPattern) {
    if (maskPattern >= 0 && maskPattern < MASK_PATTERNS.length) {
      const mask = MASK_PATTERNS[maskPattern](row, col);
      return bit ^ mask;
    }
    return bit;
  }
  
  decodeBits(bits) {
    if (bits.length < 4) return '';
    
    const mode = parseInt(bits.substring(0, 4), 2);
    if (!this.modes[mode]) return '';
    
    const modeType = this.modes[mode];
    const lengthBits = this.getCharacterCountLength(mode, 1);
    
    if (bits.length < 4 + lengthBits) return '';
    
    const length = parseInt(bits.substring(4, 4 + lengthBits), 2);
    const dataBits = bits.substring(4 + lengthBits);
    
    switch (modeType) {
      case 'NUMERIC':
        return this.decodeNumeric(dataBits, length);
      case 'ALPHANUMERIC':
        return this.decodeAlphanumeric(dataBits, length);
      case 'BYTE':
        return this.decodeByte(dataBits, length);
      default:
        return '';
    }
  }
  
  getCharacterCountLength(mode, version) {
    if (mode === 1) { // NUMERIC
      return version <= 9 ? 10 : version <= 26 ? 12 : 14;
    } else if (mode === 2) { // ALPHANUMERIC
      return version <= 9 ? 9 : version <= 26 ? 11 : 13;
    } else { // BYTE
      return version <= 9 ? 8 : version <= 26 ? 16 : 16;
    }
  }
  
  decodeNumeric(bits, length) {
    let result = '';
    
    for (let i = 0; i < length; i += 3) {
      const remaining = Math.min(3, length - i);
      const bitLength = remaining === 3 ? 10 : remaining === 2 ? 7 : 4;
      
      if (bits.length < bitLength) break;
      
      const value = parseInt(bits.substring(0, bitLength), 2);
      result += value.toString().padStart(remaining, '0');
      bits = bits.substring(bitLength);
    }
    
    return result.substring(0, length);
  }
  
  decodeAlphanumeric(bits, length) {
    let result = '';
    
    for (let i = 0; i < length; i += 2) {
      const remaining = Math.min(2, length - i);
      
      if (remaining === 2) {
        if (bits.length < 11) break;
        const value = parseInt(bits.substring(0, 11), 2);
        result += ALPHANUMERIC_CHARS[Math.floor(value / 45)] + ALPHANUMERIC_CHARS[value % 45];
        bits = bits.substring(11);
      } else {
        if (bits.length < 6) break;
        const value = parseInt(bits.substring(0, 6), 2);
        result += ALPHANUMERIC_CHARS[value];
        bits = bits.substring(6);
      }
    }
    
    return result.substring(0, length);
  }
  
  decodeByte(bits, length) {
    let result = '';
    
    for (let i = 0; i < length; i++) {
      if (bits.length < 8) break;
      const value = parseInt(bits.substring(0, 8), 2);
      result += String.fromCharCode(value);
      bits = bits.substring(8);
    }
    
    return result;
  }
}