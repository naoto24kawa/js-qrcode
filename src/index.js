// Core exports
export { QRCodeGenerator } from './generator.js';
export { QRCodeEncoder } from './encoder.js';
export { QRErrorCorrection } from './reed-solomon.js';
export { QRMasking } from './masking.js';
export { SVGRenderer } from './renderers/svg-renderer.js';
export { PNGRenderer } from './renderers/png-renderer.js';
export * from './utils.js';
export * from './base64-utils.js';
export * from './errors.js';
export * from './validation.js';

import { QRCodeGenerator } from './generator.js';
import { QRCodeGenerationError } from './errors.js';
import { QRCodeValidation } from './validation.js';

// Simple QR code generation API
const QRCode = {
  generate: (data, options = {}) => {
    try {
      QRCodeValidation.validateGenerateInput(data);
      
      const generator = new QRCodeGenerator();
      const result = generator.generate(data, options);
      
      // Return SVG string for backward compatibility
      if (options.returnObject === true) {
        return result;
      }
      
      return result.svg || result.png || '';
    } catch (error) {
      if (error instanceof QRCodeGenerationError) {
        throw error;
      }
      throw new QRCodeGenerationError('QR code generation failed', 'GENERATION_FAILED');
    }
  },

  errors: {
    QRCodeGenerationError
  }
};

export default QRCode;
export { QRCode };