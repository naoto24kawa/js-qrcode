import { QRModeDetector } from './mode-detector.js';
import { QRVersionSelector } from './version-selector.js';
import { QRDataEncoderCore } from './data-encoder-core.js';
import { QRDataPadder } from './data-padder.js';
import { QRModuleBuilder } from './module-builder.js';
import { QRErrorCorrection } from './reed-solomon.js';
import { QRMasking } from './masking.js';
import { MODULE_SIZES } from './constants/index.js';
import { codewordsToBits } from './utils.js';

export class QRCodeEncoder {
  constructor() {
    this.modeDetector = new QRModeDetector();
    this.versionSelector = new QRVersionSelector();
    this.dataEncoderCore = new QRDataEncoderCore();
    this.dataPadder = new QRDataPadder();
    this.moduleBuilder = new QRModuleBuilder();
    this.errorCorrection = new QRErrorCorrection();
    this.masking = new QRMasking();
  }
  
  encode(data, errorCorrectionLevel = 'M', options = {}) {
    const mode = this.modeDetector.detectMode(data);
    const version = this.versionSelector.determineVersion(data, mode, errorCorrectionLevel);
    
    // 1. Encode data to bytes
    const dataBits = this.dataEncoderCore.encode(data, mode, version);
    const dataBytes = this.dataPadder.addPadding(dataBits, version, errorCorrectionLevel);
    
    // 2. Add error correction
    const codewords = this.errorCorrection.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
    
    // 3. Convert codewords to bit string
    const codewordBits = codewordsToBits(codewords);
    
    // 4. Generate base modules (without masking)
    const baseModules = this.moduleBuilder.generateModules(codewordBits, version, errorCorrectionLevel);
    const size = MODULE_SIZES.BASE_SIZE + (version - 1) * MODULE_SIZES.VERSION_INCREMENT;
    
    // 5. Find best mask pattern (or use forced mask)
    const maskingOptions = { ...options, errorCorrectionLevel };
    const bestMask = this.masking.findBestMask(baseModules, size, maskingOptions);
    
    // 6. Apply mask
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

}