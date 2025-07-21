/**
 * Base QR Code Error with enhanced details and categorization
 */
class QRCodeError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Enhance stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/debugging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    return this.details.userMessage || this.message;
  }
}

// Generation errors
export class QRCodeGenerationError extends QRCodeError {
  static get CODES() {
    return {
      INVALID_DATA: 'INVALID_DATA',
      DATA_TOO_LONG: 'DATA_TOO_LONG',
      INVALID_OPTIONS: 'INVALID_OPTIONS',
      ENCODING_FAILED: 'ENCODING_FAILED',
      RENDERING_FAILED: 'RENDERING_FAILED'
    };
  }
}

// Decode errors
export class QRCodeDecodeError extends QRCodeError {
  static get CODES() {
    return {
      INVALID_IMAGE: 'INVALID_IMAGE',
      NO_QR_FOUND: 'NO_QR_FOUND',
      FINDER_PATTERN_NOT_FOUND: 'FINDER_PATTERN_NOT_FOUND',
      FORMAT_INFO_ERROR: 'FORMAT_INFO_ERROR',
      DATA_DECODE_ERROR: 'DATA_DECODE_ERROR',
      PERSPECTIVE_CORRECTION_FAILED: 'PERSPECTIVE_CORRECTION_FAILED',
      PREPROCESSING_FAILED: 'PREPROCESSING_FAILED'
    };
  }
}

// Camera and hardware errors
export class CameraAccessError extends QRCodeError {
  static get CODES() {
    return {
      PERMISSION_DENIED: 'PERMISSION_DENIED',
      DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
      NOT_SUPPORTED: 'NOT_SUPPORTED',
      HARDWARE_ERROR: 'HARDWARE_ERROR',
      STREAM_ERROR: 'STREAM_ERROR'
    };
  }
}

// Environment and platform errors
export class EnvironmentError extends QRCodeError {
  static get CODES() {
    return {
      UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
      MISSING_DEPENDENCIES: 'MISSING_DEPENDENCIES',
      SECURITY_RESTRICTION: 'SECURITY_RESTRICTION',
      FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE'
    };
  }
}

// Input validation errors
export class ValidationError extends QRCodeError {
  static get CODES() {
    return {
      INVALID_PARAMETER: 'INVALID_PARAMETER',
      MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
      TYPE_MISMATCH: 'TYPE_MISMATCH',
      VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE'
    };
  }
}

/**
 * Error factory for creating standardized errors
 */
export class ErrorFactory {
  /**
   * Create generation error with context
   */
  static createGenerationError(code, message, details = {}) {
    return new QRCodeGenerationError(message, code, {
      category: 'generation',
      userMessage: this.getUserMessage('generation', code),
      ...details
    });
  }

  /**
   * Create decode error with context
   */
  static createDecodeError(code, message, details = {}) {
    return new QRCodeDecodeError(message, code, {
      category: 'decode',
      userMessage: this.getUserMessage('decode', code),
      ...details
    });
  }

  /**
   * Create camera error with context
   */
  static createCameraError(code, message, details = {}) {
    return new CameraAccessError(message, code, {
      category: 'camera',
      userMessage: this.getUserMessage('camera', code),
      ...details
    });
  }

  /**
   * Create environment error with context
   */
  static createEnvironmentError(code, message, details = {}) {
    return new EnvironmentError(message, code, {
      category: 'environment',
      userMessage: this.getUserMessage('environment', code),
      ...details
    });
  }

  /**
   * Get user-friendly error messages
   */
  static getUserMessage(category, code) {
    const messages = {
      generation: {
        [QRCodeGenerationError.CODES.INVALID_DATA]: 'The provided data cannot be encoded into a QR code.',
        [QRCodeGenerationError.CODES.DATA_TOO_LONG]: 'The data is too long for the selected QR code version.',
        [QRCodeGenerationError.CODES.INVALID_OPTIONS]: 'Invalid options provided for QR code generation.',
        [QRCodeGenerationError.CODES.ENCODING_FAILED]: 'Failed to encode the data into QR code format.',
        [QRCodeGenerationError.CODES.RENDERING_FAILED]: 'Failed to render the QR code to the specified format.'
      },
      decode: {
        [QRCodeDecodeError.CODES.INVALID_IMAGE]: 'The provided image is invalid or cannot be processed.',
        [QRCodeDecodeError.CODES.NO_QR_FOUND]: 'No QR code found in the image.',
        [QRCodeDecodeError.CODES.FINDER_PATTERN_NOT_FOUND]: 'QR code finder patterns not detected.',
        [QRCodeDecodeError.CODES.FORMAT_INFO_ERROR]: 'Cannot read QR code format information.',
        [QRCodeDecodeError.CODES.DATA_DECODE_ERROR]: 'Failed to decode QR code data.',
        [QRCodeDecodeError.CODES.PERSPECTIVE_CORRECTION_FAILED]: 'Failed to correct QR code perspective.',
        [QRCodeDecodeError.CODES.PREPROCESSING_FAILED]: 'Image preprocessing failed.'
      },
      camera: {
        [CameraAccessError.CODES.PERMISSION_DENIED]: 'Camera access permission denied.',
        [CameraAccessError.CODES.DEVICE_NOT_FOUND]: 'No camera device found.',
        [CameraAccessError.CODES.NOT_SUPPORTED]: 'Camera access not supported in this environment.',
        [CameraAccessError.CODES.HARDWARE_ERROR]: 'Camera hardware error.',
        [CameraAccessError.CODES.STREAM_ERROR]: 'Camera stream error.'
      },
      environment: {
        [EnvironmentError.CODES.UNSUPPORTED_BROWSER]: 'This browser is not supported.',
        [EnvironmentError.CODES.MISSING_DEPENDENCIES]: 'Required dependencies are missing.',
        [EnvironmentError.CODES.SECURITY_RESTRICTION]: 'Security restrictions prevent this operation.',
        [EnvironmentError.CODES.FEATURE_NOT_AVAILABLE]: 'This feature is not available in the current environment.'
      }
    };

    return messages[category]?.[code] || 'An unexpected error occurred.';
  }
}