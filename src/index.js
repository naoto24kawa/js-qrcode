export { QRCodeGenerator } from './generator.js';
export { QRCodeEncoder } from './encoder.js';
export { QRCodeDecoder } from './decoder.js';
export { QRCodeScanner } from './scanner.js';
export { QRErrorCorrection } from './reed-solomon.js';
export { QRMasking } from './masking.js';
export { SVGRenderer } from './renderers/svg-renderer.js';
export { PNGRenderer } from './renderers/png-renderer.js';
export * from './utils.js';
export * from './errors.js';

import { QRCodeGenerator } from './generator.js';
import { QRCodeDecoder } from './decoder.js';
import { QRCodeScanner } from './scanner.js';
import { QRCodeGenerationError, QRCodeDecodeError, CameraAccessError, EnvironmentError } from './errors.js';
import { MAX_DATA_LENGTH } from './constants.js';

class QRCodeValidation {
  static validateGenerateInput(data) {
    if (!data || typeof data !== 'string') {
      throw new QRCodeGenerationError('Invalid data provided', 'INVALID_DATA');
    }
    
    if (data.length > MAX_DATA_LENGTH) {
      throw new QRCodeGenerationError('Data too long for QR code', 'DATA_TOO_LONG');
    }
  }

  static validateDecodeInput(data) {
    if (!data) {
      throw new QRCodeDecodeError('No data provided', 'INVALID_DATA');
    }
  }
}

const QRCode = {
  generate: (data, options = {}) => {
    try {
      QRCodeValidation.validateGenerateInput(data);
      
      const generator = new QRCodeGenerator();
      return generator.generate(data, options);
    } catch (error) {
      if (error instanceof QRCodeGenerationError) {
        throw error;
      }
      throw new QRCodeGenerationError('QR code generation failed', 'GENERATION_FAILED');
    }
  },
  
  decode: async (data, options = {}) => {
    try {
      QRCodeValidation.validateDecodeInput(data);
      
      const decoder = new QRCodeDecoder();
      const result = await decoder.decode(data, options);
      
      if (result === null) {
        throw new QRCodeDecodeError('Failed to decode QR code', 'DECODE_FAILED');
      }
      
      return result;
    } catch (error) {
      if (error instanceof QRCodeDecodeError) {
        throw error;
      }
      throw new QRCodeDecodeError('QR code decoding failed', 'DECODE_FAILED');
    }
  },
  
  get Scanner() {
    return QRCodeScanner;
  },
  
  errors: {
    QRCodeGenerationError,
    QRCodeDecodeError,
    CameraAccessError,
    EnvironmentError
  }
};

export default QRCode;
export { QRCode };