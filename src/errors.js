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
 * Error handler registry for custom error handling strategies
 */
export class ErrorHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.globalHandlers = [];
    this.middleware = [];
  }

  /**
   * Register error handler for specific error code
   */
  register(errorCode, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.handlers.set(errorCode, handler);
    return this;
  }

  /**
   * Register handler for all errors of a specific type
   */
  registerForType(ErrorClass, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.handlers.set(ErrorClass.name, handler);
    return this;
  }

  /**
   * Register global error handler (fallback)
   */
  registerGlobal(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.globalHandlers.push(handler);
    return this;
  }

  /**
   * Register middleware for error processing
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Handle error with registered handlers
   */
  async handle(error, context = {}) {
    // Apply middleware
    let processedError = error;
    for (const middleware of this.middleware) {
      processedError = await this.callSafely(middleware, processedError, context) || processedError;
    }

    // Try specific code handler
    const codeHandler = this.handlers.get(processedError.code);
    if (codeHandler) {
      return await this.callSafely(codeHandler, processedError, context);
    }

    // Try type handler
    const typeHandler = this.handlers.get(processedError.constructor.name);
    if (typeHandler) {
      return await this.callSafely(typeHandler, processedError, context);
    }

    // Try global handlers
    for (const globalHandler of this.globalHandlers) {
      const result = await this.callSafely(globalHandler, processedError, context);
      if (result !== undefined) {
        return result;
      }
    }

    // No handler found, return original error
    return processedError;
  }

  /**
   * Safely call handler with error catching
   */
  async callSafely(handler, error, context) {
    try {
      return await handler(error, context);
    } catch (handlerError) {
      console.warn('Error handler failed:', handlerError);
      return undefined;
    }
  }

  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
    this.globalHandlers.length = 0;
    this.middleware.length = 0;
    return this;
  }

  /**
   * Get registered handlers info
   */
  getHandlersInfo() {
    return {
      specific: Array.from(this.handlers.keys()),
      global: this.globalHandlers.length,
      middleware: this.middleware.length
    };
  }
}

/**
 * Error context builder for enhanced error information
 */
export class ErrorContext {
  constructor() {
    this.data = {};
  }

  /**
   * Add operation context
   */
  withOperation(operation) {
    this.data.operation = operation;
    return this;
  }

  /**
   * Add input data context
   */
  withInput(input) {
    this.data.input = input;
    return this;
  }

  /**
   * Add user context
   */
  withUser(userId, sessionId) {
    this.data.user = { userId, sessionId };
    return this;
  }

  /**
   * Add performance metrics
   */
  withMetrics(startTime, memoryUsage) {
    this.data.metrics = {
      duration: Date.now() - startTime,
      memoryUsage
    };
    return this;
  }

  /**
   * Add environment info
   */
  withEnvironment(environment) {
    this.data.environment = environment;
    return this;
  }

  /**
   * Add custom data
   */
  withCustom(key, value) {
    this.data.custom = this.data.custom || {};
    this.data.custom[key] = value;
    return this;
  }

  /**
   * Build context object
   */
  build() {
    return { ...this.data };
  }
}

/**
 * Enhanced error factory with context support
 */
export class ErrorFactory {
  /**
   * Create generation error with enhanced context
   */
  static createGenerationError(code, message, details = {}, context = null) {
    const errorDetails = {
      category: 'generation',
      userMessage: this.getUserMessage('generation', code),
      context: context?.build ? context.build() : context,
      ...details
    };
    return new QRCodeGenerationError(message, code, errorDetails);
  }


  /**
   * Create environment error with enhanced context
   */
  static createEnvironmentError(code, message, details = {}, context = null) {
    const errorDetails = {
      category: 'environment',
      userMessage: this.getUserMessage('environment', code),
      context: context?.build ? context.build() : context,
      ...details
    };
    return new EnvironmentError(message, code, errorDetails);
  }

  /**
   * Create validation error with enhanced context
   */
  static createValidationError(code, message, details = {}, context = null) {
    const errorDetails = {
      category: 'validation',
      userMessage: this.getUserMessage('validation', code),
      context: context?.build ? context.build() : context,
      ...details
    };
    return new ValidationError(message, code, errorDetails);
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
      environment: {
        [EnvironmentError.CODES.UNSUPPORTED_BROWSER]: 'This browser is not supported.',
        [EnvironmentError.CODES.MISSING_DEPENDENCIES]: 'Required dependencies are missing.',
        [EnvironmentError.CODES.SECURITY_RESTRICTION]: 'Security restrictions prevent this operation.',
        [EnvironmentError.CODES.FEATURE_NOT_AVAILABLE]: 'This feature is not available in the current environment.'
      },
      validation: {
        [ValidationError.CODES.INVALID_PARAMETER]: 'Invalid parameter provided.',
        [ValidationError.CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
        [ValidationError.CODES.TYPE_MISMATCH]: 'Parameter type does not match expected type.',
        [ValidationError.CODES.VALUE_OUT_OF_RANGE]: 'Parameter value is out of allowed range.'
      }
    };

    return messages[category]?.[code] || 'An unexpected error occurred.';
  }
}

/**
 * Error analytics and reporting utilities
 */
export class ErrorAnalytics {
  constructor() {
    this.errors = [];
    this.patterns = new Map();
    this.metrics = {
      total: 0,
      byType: new Map(),
      byCode: new Map(),
      byHour: new Map()
    };
  }

  /**
   * Track error occurrence
   */
  track(error, context = {}) {
    const errorEntry = {
      error,
      context,
      timestamp: new Date(),
      id: this.generateId()
    };

    this.errors.push(errorEntry);
    this.updateMetrics(error);
    this.detectPatterns(error, context);

    // Cleanup old entries (keep last 1000)
    if (this.errors.length > 1000) {
      this.errors.shift();
    }

    return errorEntry.id;
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      total: this.metrics.total,
      byType: Object.fromEntries(this.metrics.byType),
      byCode: Object.fromEntries(this.metrics.byCode),
      patterns: Array.from(this.patterns.entries()),
      recentErrors: this.errors.slice(-10).map(e => ({
        type: e.error.constructor.name,
        code: e.error.code,
        message: e.error.message,
        timestamp: e.timestamp
      }))
    };
  }

  /**
   * Get errors by filter
   */
  getErrors(filter = {}) {
    return this.errors.filter(entry => {
      if (filter.type && entry.error.constructor.name !== filter.type) return false;
      if (filter.code && entry.error.code !== filter.code) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      if (filter.until && entry.timestamp > filter.until) return false;
      return true;
    });
  }

  /**
   * Clear error history
   */
  clear() {
    this.errors.length = 0;
    this.patterns.clear();
    this.metrics = {
      total: 0,
      byType: new Map(),
      byCode: new Map(),
      byHour: new Map()
    };
  }

  /**
   * Update metrics
   */
  updateMetrics(error) {
    this.metrics.total++;
    
    const type = error.constructor.name;
    this.metrics.byType.set(type, (this.metrics.byType.get(type) || 0) + 1);
    
    const code = error.code;
    this.metrics.byCode.set(code, (this.metrics.byCode.get(code) || 0) + 1);
    
    const hour = new Date().getHours();
    this.metrics.byHour.set(hour, (this.metrics.byHour.get(hour) || 0) + 1);
  }

  /**
   * Detect error patterns
   */
  detectPatterns(error, context) {
    const pattern = `${error.constructor.name}:${error.code}`;
    const count = this.patterns.get(pattern) || 0;
    this.patterns.set(pattern, count + 1);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}