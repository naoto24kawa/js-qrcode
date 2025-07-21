import { QRDataEncoder, createQRDataEncoder } from './data-encoder-wasm.js';
import { QRModuleBuilder } from './module-builder.js';
import { QRErrorCorrection, createQRErrorCorrection } from './reed-solomon-wasm.js';
import { QRMasking, createQRMasking } from './masking-wasm.js';
import { MODULE_SIZES } from './constants.js';

export class QRCodeEncoder {
  constructor(options = {}) {
    this.dataEncoder = createQRDataEncoder(options.forceJS);
    this.moduleBuilder = new QRModuleBuilder();
    this.errorCorrection = createQRErrorCorrection(options.forceJS);
    this.masking = createQRMasking(options.forceJS);
  }
  
  async encode(data, errorCorrectionLevel = 'M', options = {}) {
    const mode = await this.dataEncoder.detectMode(data);
    const version = await this.dataEncoder.determineVersion(data, mode, errorCorrectionLevel);
    
    // 1. Encode data to bytes - may use WASM if available
    const dataBytes = await this.dataEncoder.encodeToBytes(data, mode, version, errorCorrectionLevel);
    
    // 2. Add error correction (may use WASM if available)
    const codewords = await this.errorCorrection.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
    
    // 3. Convert codewords to bit string
    const dataBits = this.codewordsToBits(codewords);
    
    // 4. Generate base modules (without masking)
    const baseModules = this.moduleBuilder.generateModules(dataBits, version, errorCorrectionLevel);
    const size = MODULE_SIZES.BASE_SIZE + (version - 1) * MODULE_SIZES.VERSION_INCREMENT;
    
    // 5. Find best mask pattern (or use forced mask) - may use WASM if available
    const maskingOptions = { ...options, errorCorrectionLevel };
    const bestMask = await this.masking.findBestMask(baseModules, size, maskingOptions);
    
    // 6. Apply mask - may use WASM if available
    const maskedModules = await this.masking.applyMask(baseModules, bestMask, size);
    
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

}