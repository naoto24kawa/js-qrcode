import { QRDataEncoder } from './data-encoder.js';
import { QRModuleBuilder } from './module-builder.js';
import { QRErrorCorrection } from './reed-solomon.js';
import { QRMasking } from './masking.js';
import { MODULE_SIZES } from './constants.js';

export class QRCodeEncoder {
  constructor() {
    this.dataEncoder = new QRDataEncoder();
    this.moduleBuilder = new QRModuleBuilder();
    this.errorCorrection = new QRErrorCorrection();
    this.masking = new QRMasking();
  }
  
  encode(data, errorCorrectionLevel = 'M') {
    const mode = this.dataEncoder.detectMode(data);
    const version = this.dataEncoder.determineVersion(data, mode, errorCorrectionLevel);
    
    // 1. Encode data to bytes
    const dataBytes = this.dataEncoder.encodeToBytes(data, mode, version, errorCorrectionLevel);
    
    // 2. Add error correction
    const codewords = this.errorCorrection.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
    
    // 3. Convert codewords to bit string
    const dataBits = this.codewordsToBits(codewords);
    
    // 4. Generate base modules (without masking)
    const baseModules = this.moduleBuilder.generateModules(dataBits, version, errorCorrectionLevel);
    const size = MODULE_SIZES.BASE_SIZE + (version - 1) * MODULE_SIZES.VERSION_INCREMENT;
    
    // 5. Find best mask pattern
    const bestMask = this.masking.findBestMask(baseModules, size);
    
    // 6. Apply best mask
    const maskedModules = this.masking.applyMask(baseModules, bestMask, size);
    
    // 7. Update format information with correct mask pattern
    const finalModules = this.moduleBuilder.addFormatInfoWithMask(maskedModules, size, errorCorrectionLevel, bestMask);
    
    return {
      data,
      mode,
      version,
      errorCorrectionLevel,
      maskPattern: bestMask,
      modules: finalModules,
      size
    };
  }

  codewordsToBits(codewords) {
    let bits = '';
    for (const codeword of codewords) {
      bits += codeword.toString(2).padStart(8, '0');
    }
    return bits;
  }

  // Backward compatibility methods for tests
  get modes() {
    return {
      NUMERIC: 1,
      ALPHANUMERIC: 2,
      BYTE: 4,
      KANJI: 8
    };
  }

  detectMode(data) {
    return this.dataEncoder.detectMode(data);
  }

  determineVersion(data, mode, errorCorrectionLevel) {
    return this.dataEncoder.determineVersion(data, mode, errorCorrectionLevel);
  }

  encodeNumeric(data) {
    return this.dataEncoder.encodeNumeric(data);
  }

  encodeAlphanumeric(data) {
    return this.dataEncoder.encodeAlphanumeric(data);
  }

  encodeByte(data) {
    return this.dataEncoder.encodeByte(data);
  }

  generateModules(dataBits, version, errorCorrectionLevel) {
    return this.moduleBuilder.generateModules(dataBits, version, errorCorrectionLevel);
  }
}