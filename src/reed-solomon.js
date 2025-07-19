/**
 * Reed-Solomon Error Correction Implementation for QR Codes
 */

// Galois Field (GF(256)) operations for Reed-Solomon
class GaloisField {
  constructor() {
    this.size = 256;
    this.primitive = 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
    this.logTable = new Array(this.size);
    this.expTable = new Array(this.size);
    this.initTables();
  }

  initTables() {
    let x = 1;
    for (let i = 0; i < this.size - 1; i++) {
      this.expTable[i] = x;
      this.logTable[x] = i;
      x <<= 1;
      if (x & this.size) {
        x ^= this.primitive;
      }
    }
    this.expTable[this.size - 1] = 1;
    this.logTable[0] = 0; // undefined, but we'll use 0
  }

  multiply(a, b) {
    if (a === 0 || b === 0) return 0;
    return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
  }

  divide(a, b) {
    if (a === 0) return 0;
    if (b === 0) throw new Error('Division by zero');
    return this.expTable[(this.logTable[a] - this.logTable[b] + (this.size - 1)) % (this.size - 1)];
  }

  power(base, exp) {
    if (base === 0) return 0;
    return this.expTable[(this.logTable[base] * exp) % (this.size - 1)];
  }

  inverse(a) {
    if (a === 0) throw new Error('Cannot invert zero');
    return this.expTable[(this.size - 1) - this.logTable[a]];
  }
}

// Reed-Solomon Encoder
export class ReedSolomonEncoder {
  constructor() {
    this.gf = new GaloisField();
  }

  encode(data, eccCount) {
    // Create generator polynomial
    const generator = this.createGenerator(eccCount);
    
    // Prepare data polynomial (left-shift by eccCount)
    const dataLength = data.length;
    const totalLength = dataLength + eccCount;
    const polynomial = new Array(totalLength).fill(0);
    
    // Copy data to the left side of polynomial
    for (let i = 0; i < dataLength; i++) {
      polynomial[i] = data[i];
    }

    // Perform polynomial division
    for (let i = 0; i < dataLength; i++) {
      const coeff = polynomial[i];
      if (coeff !== 0) {
        for (let j = 0; j < generator.length; j++) {
          polynomial[i + j] ^= this.gf.multiply(generator[j], coeff);
        }
      }
    }

    // Extract error correction codewords
    const eccBytes = polynomial.slice(dataLength);
    return [...data, ...eccBytes];
  }

  createGenerator(eccCount) {
    let generator = [1];
    
    for (let i = 0; i < eccCount; i++) {
      generator = this.multiplyPolynomials(generator, [1, this.gf.power(2, i)]);
    }
    
    return generator;
  }

  multiplyPolynomials(poly1, poly2) {
    const result = new Array(poly1.length + poly2.length - 1).fill(0);
    
    for (let i = 0; i < poly1.length; i++) {
      for (let j = 0; j < poly2.length; j++) {
        result[i + j] ^= this.gf.multiply(poly1[i], poly2[j]);
      }
    }
    
    return result;
  }
}

// QR Code specific error correction parameters
export const ERROR_CORRECTION_PARAMS = {
  1: {
    L: { dataCodewords: 19, eccCodewords: 7, blocks: 1 },
    M: { dataCodewords: 16, eccCodewords: 10, blocks: 1 },
    Q: { dataCodewords: 13, eccCodewords: 13, blocks: 1 },
    H: { dataCodewords: 9, eccCodewords: 17, blocks: 1 }
  },
  2: {
    L: { dataCodewords: 34, eccCodewords: 10, blocks: 1 },
    M: { dataCodewords: 28, eccCodewords: 16, blocks: 1 },
    Q: { dataCodewords: 22, eccCodewords: 22, blocks: 1 },
    H: { dataCodewords: 16, eccCodewords: 28, blocks: 1 }
  },
  3: {
    L: { dataCodewords: 55, eccCodewords: 15, blocks: 1 },
    M: { dataCodewords: 44, eccCodewords: 26, blocks: 1 },
    Q: { dataCodewords: 34, eccCodewords: 36, blocks: 2 },
    H: { dataCodewords: 26, eccCodewords: 44, blocks: 2 }
  },
  4: {
    L: { dataCodewords: 80, eccCodewords: 20, blocks: 1 },
    M: { dataCodewords: 64, eccCodewords: 36, blocks: 2 },
    Q: { dataCodewords: 48, eccCodewords: 52, blocks: 2 },
    H: { dataCodewords: 36, eccCodewords: 64, blocks: 4 }
  },
  5: {
    L: { dataCodewords: 108, eccCodewords: 26, blocks: 1 },
    M: { dataCodewords: 86, eccCodewords: 48, blocks: 2 },
    Q: { dataCodewords: 62, eccCodewords: 72, blocks: 2 },
    H: { dataCodewords: 46, eccCodewords: 88, blocks: 4 }
  }
};

// QR Code Error Correction Manager
export class QRErrorCorrection {
  constructor() {
    this.encoder = new ReedSolomonEncoder();
  }

  addErrorCorrection(dataBytes, version, errorCorrectionLevel) {
    const params = ERROR_CORRECTION_PARAMS[version]?.[errorCorrectionLevel];
    if (!params) {
      throw new Error(`Unsupported version ${version} or error correction level ${errorCorrectionLevel}`);
    }

    const { dataCodewords, eccCodewords, blocks } = params;
    const totalCodewords = dataCodewords + eccCodewords;

    // Pad data to required length
    const paddedData = this.padData(dataBytes, dataCodewords);

    if (blocks === 1) {
      // Single block
      return this.encoder.encode(paddedData, eccCodewords);
    } else {
      // Multiple blocks - interleave data and error correction
      return this.processMultipleBlocks(paddedData, dataCodewords, eccCodewords, blocks);
    }
  }

  padData(data, targetLength) {
    const result = [...data];
    
    // Add terminator (0000) if there's space
    if (result.length < targetLength) {
      result.push(0);
    }

    // Pad to byte boundary
    while (result.length % 8 !== 0 && result.length < targetLength) {
      result.push(0);
    }

    // Add padding bytes
    const padBytes = [0xEC, 0x11]; // 11101100, 00010001
    let padIndex = 0;
    while (result.length < targetLength) {
      result.push(padBytes[padIndex % 2]);
      padIndex++;
    }

    return result;
  }

  processMultipleBlocks(data, dataCodewords, eccCodewords, blocks) {
    const blockSize = Math.ceil(dataCodewords / blocks);
    const dataBlocks = [];
    const eccBlocks = [];

    // Split data into blocks
    for (let i = 0; i < blocks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, data.length);
      const blockData = data.slice(start, end);
      
      // Encode each block
      const encoded = this.encoder.encode(blockData, eccCodewords);
      dataBlocks.push(encoded.slice(0, blockData.length));
      eccBlocks.push(encoded.slice(blockData.length));
    }

    // Interleave data blocks
    const interleavedData = [];
    const maxDataLength = Math.max(...dataBlocks.map(block => block.length));
    for (let i = 0; i < maxDataLength; i++) {
      for (let j = 0; j < blocks; j++) {
        if (i < dataBlocks[j].length) {
          interleavedData.push(dataBlocks[j][i]);
        }
      }
    }

    // Interleave error correction blocks
    const interleavedEcc = [];
    for (let i = 0; i < eccCodewords; i++) {
      for (let j = 0; j < blocks; j++) {
        if (i < eccBlocks[j].length) {
          interleavedEcc.push(eccBlocks[j][i]);
        }
      }
    }

    return [...interleavedData, ...interleavedEcc];
  }
}