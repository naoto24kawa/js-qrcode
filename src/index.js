export { QRCodeGenerator } from './generator.js';
export { QRCodeEncoder } from './encoder.js';
export { QRErrorCorrection } from './reed-solomon.js';
export { QRMasking } from './masking.js';
export { SVGRenderer } from './renderers/svg-renderer.js';
export { PNGRenderer } from './renderers/png-renderer.js';
export * from './utils.js';
export * from './base64-utils.js';
export * from './errors.js';
export * from './error-router.js';

import { QRCodeGenerator } from './generator.js';
import { 
  QRCodeGenerationError, 
  EnvironmentError,
  ErrorHandlerRegistry,
  ErrorContext,
  ErrorFactory,
  ErrorAnalytics
} from './errors.js';
import { ErrorRouter, ErrorClassifier } from './error-router.js';
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
}

const QRCode = {
  // Error handling system
  errorHandler: new ErrorHandlerRegistry(),
  analytics: new ErrorAnalytics(),
  router: new ErrorRouter(),
  classifier: new ErrorClassifier(),

  generate: (data, options = {}) => {
    try {
      QRCodeValidation.validateGenerateInput(data);
      
      const generator = new QRCodeGenerator();
      const result = generator.generate(data, options);
      
      // 後方互換性のため、デフォルトではSVG文字列を返す
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

  generateWithAnalytics: async (data, options = {}) => {
    const startTime = Date.now();
    let context = null;

    try {
      QRCodeValidation.validateGenerateInput(data);
      
      // Build comprehensive context for error tracking
      context = new ErrorContext()
        .withOperation('generateWithAnalytics')
        .withInput({ 
          dataLength: data.length,
          dataType: typeof data,
          dataSample: data.length > 100 ? `${data.substring(0, 100)}...` : data,
          options: { ...options, returnObject: undefined } // Exclude large objects
        })
        .withEnvironment({ 
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
          platform: typeof process !== 'undefined' ? process.platform : 'browser',
          nodeVersion: typeof process !== 'undefined' ? process.version : undefined,
          timestamp: new Date().toISOString(),
          memory: typeof process !== 'undefined' ? process.memoryUsage() : undefined
        })
        .withCustom('apiVersion', '1.0')
        .withCustom('features', Object.keys(options));
      
      const generator = new QRCodeGenerator();
      const result = generator.generate(data, options);
      
      // Add performance metrics
      context.withMetrics(startTime, process?.memoryUsage?.()?.heapUsed);
      
      // 後方互換性のため、デフォルトではSVG文字列を返す
      if (options.returnObject === true) {
        return result;
      }
      
      return result.svg || result.png || '';
    } catch (error) {
      const contextData = context?.build();
      
      // Track error for analytics
      if (error instanceof QRCodeGenerationError) {
        QRCode.analytics.track(error, contextData);
        
        // Route error through classification and routing system
        const routedError = await QRCode.router.routeError(error, contextData);
        
        // Try to handle error with registered handlers
        const handledError = await QRCode.errorHandler.handle(routedError, contextData);
        throw handledError || routedError;
      }
      
      const wrappedError = new QRCodeGenerationError('QR code generation failed', 'GENERATION_FAILED');
      QRCode.analytics.track(wrappedError, contextData);
      
      // Route wrapped error as well
      const routedWrappedError = await QRCode.router.routeError(wrappedError, contextData);
      throw routedWrappedError;
    }
  },
  
  // Error handling utilities
  onError: (errorCodeOrType, handler) => {
    if (typeof errorCodeOrType === 'function') {
      return QRCode.errorHandler.registerForType(errorCodeOrType, handler);
    }
    return QRCode.errorHandler.register(errorCodeOrType, handler);
  },
  
  onAllErrors: (handler) => {
    return QRCode.errorHandler.registerGlobal(handler);
  },
  
  useErrorMiddleware: (middleware) => {
    return QRCode.errorHandler.use(middleware);
  },
  
  getErrorStats: () => {
    return QRCode.analytics.getStats();
  },
  
  clearErrorHistory: () => {
    QRCode.analytics.clear();
  },
  
  // Advanced error handling utilities
  classifyError: (error) => {
    return QRCode.classifier.classify(error);
  },
  
  addErrorRoute: (criteria, handler) => {
    return QRCode.router.route(criteria, handler);
  },
  
  addSeverityRule: (errorCode, severity) => {
    return QRCode.classifier.addSeverityRule(errorCode, severity);
  },
  
  getHandlersInfo: () => {
    return QRCode.errorHandler.getHandlersInfo();
  },
  
  // Utility for creating custom errors with context
  createError: (type, code, message, details = {}, context = null) => {
    switch (type) {
      case 'generation':
        return ErrorFactory.createGenerationError(code, message, details, context);
      case 'environment':
        return ErrorFactory.createEnvironmentError(code, message, details, context);
      case 'validation':
        return ErrorFactory.createValidationError(code, message, details, context);
      default:
        throw new Error(`Unknown error type: ${type}`);
    }
  },
  
  errors: {
    QRCodeGenerationError,
    EnvironmentError,
    ErrorHandlerRegistry,
    ErrorContext,
    ErrorFactory,
    ErrorAnalytics,
    ErrorRouter,
    ErrorClassifier
  }
};

export default QRCode;
export { QRCode };