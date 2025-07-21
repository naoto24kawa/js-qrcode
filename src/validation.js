import { QRCodeGenerationError } from './errors.js';
import { MAX_DATA_LENGTH } from './constants/index.js';

export class QRCodeValidation {
  static validateGenerateInput(data) {
    if (!data || typeof data !== 'string') {
      throw new QRCodeGenerationError('Invalid data provided', 'INVALID_DATA');
    }
    
    if (data.length > MAX_DATA_LENGTH) {
      throw new QRCodeGenerationError('Data too long for QR code', 'DATA_TOO_LONG');
    }
  }
}