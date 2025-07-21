/**
 * QR Code Error Classes
 */

/**
 * Base QR Code Error
 */
class QRCodeError extends Error {
  constructor(message, code = null, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    return this.details.userMessage || this.message;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details
    };
  }
}

/**
 * QR Code generation errors
 */
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

/**
 * Environment and platform errors
 */
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

/**
 * Input validation errors
 */
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
 * Simple error factory for common error creation
 */
export class ErrorFactory {
  /**
   * Create validation error
   */
  static createValidationError(message, field = null) {
    return new ValidationError(message, ValidationError.CODES.INVALID_PARAMETER, {
      field,
      userMessage: `Invalid ${field || 'parameter'}: ${message}`
    });
  }

  /**
   * Create generation error
   */
  static createGenerationError(message, code = null) {
    return new QRCodeGenerationError(message, code || QRCodeGenerationError.CODES.ENCODING_FAILED, {
      userMessage: `QR Code generation failed: ${message}`
    });
  }

  /**
   * Create environment error
   */
  static createEnvironmentError(message, code = null) {
    return new EnvironmentError(message, code || EnvironmentError.CODES.FEATURE_NOT_AVAILABLE, {
      userMessage: `Environment issue: ${message}`
    });
  }
}

// Export base class
export { QRCodeError };