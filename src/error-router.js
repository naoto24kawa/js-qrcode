/**
 * Error routing and classification utilities
 */

import { 
  QRCodeGenerationError, 
  EnvironmentError,
  ValidationError,
  ErrorFactory 
} from './errors.js';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error classification system
 */
export class ErrorClassifier {
  constructor() {
    this.rules = new Map();
    this.severityRules = new Map();
    this.initDefaultRules();
  }

  /**
   * Initialize default classification rules
   */
  initDefaultRules() {
    // Severity classification
    this.addSeverityRule(QRCodeGenerationError.CODES.DATA_TOO_LONG, ErrorSeverity.MEDIUM);
    this.addSeverityRule(QRCodeGenerationError.CODES.INVALID_DATA, ErrorSeverity.MEDIUM);
    this.addSeverityRule(QRCodeGenerationError.CODES.RENDERING_FAILED, ErrorSeverity.HIGH);
    
    this.addSeverityRule(EnvironmentError.CODES.UNSUPPORTED_BROWSER, ErrorSeverity.CRITICAL);
    this.addSeverityRule(EnvironmentError.CODES.SECURITY_RESTRICTION, ErrorSeverity.HIGH);

    // Category classification
    this.addCategoryRule(error => error instanceof QRCodeGenerationError, 'generation');
    this.addCategoryRule(error => error instanceof EnvironmentError, 'environment');
    this.addCategoryRule(error => error instanceof ValidationError, 'validation');
  }

  /**
   * Add severity classification rule
   */
  addSeverityRule(errorCode, severity) {
    this.severityRules.set(errorCode, severity);
    return this;
  }

  /**
   * Add category classification rule
   */
  addCategoryRule(predicate, category) {
    const ruleId = `category_${this.rules.size}`;
    this.rules.set(ruleId, { type: 'category', predicate, value: category });
    return this;
  }

  /**
   * Classify error
   */
  classify(error) {
    const classification = {
      severity: this.getSeverity(error),
      category: this.getCategory(error),
      recoverable: this.isRecoverable(error),
      userFacing: this.isUserFacing(error),
      retryable: this.isRetryable(error)
    };

    return classification;
  }

  /**
   * Get error severity
   */
  getSeverity(error) {
    return this.severityRules.get(error.code) || ErrorSeverity.MEDIUM;
  }

  /**
   * Get error category
   */
  getCategory(error) {
    for (const [, rule] of this.rules) {
      if (rule.type === 'category' && rule.predicate(error)) {
        return rule.value;
      }
    }
    return 'unknown';
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error) {
    const recoverableCodes = [
      QRCodeGenerationError.CODES.DATA_TOO_LONG,
      QRCodeGenerationError.CODES.INVALID_OPTIONS,
      ValidationError.CODES.INVALID_PARAMETER
    ];
    
    return recoverableCodes.includes(error.code);
  }

  /**
   * Check if error is user-facing
   */
  isUserFacing(error) {
    const userFacingCodes = [
      QRCodeGenerationError.CODES.DATA_TOO_LONG,
      EnvironmentError.CODES.UNSUPPORTED_BROWSER
    ];
    
    return userFacingCodes.includes(error.code);
  }

  /**
   * Check if operation can be retried
   */
  isRetryable(error) {
    const retryableCodes = [
      QRCodeGenerationError.CODES.RENDERING_FAILED
    ];
    
    return retryableCodes.includes(error.code);
  }
}

/**
 * Error routing system
 */
export class ErrorRouter {
  constructor(classifier = new ErrorClassifier()) {
    this.classifier = classifier;
    this.routes = new Map();
    this.middleware = [];
    this.initDefaultRoutes();
  }

  /**
   * Initialize default routing rules
   */
  initDefaultRoutes() {
    // Route by severity
    this.route({ severity: ErrorSeverity.CRITICAL }, this.handleCriticalError);
    this.route({ severity: ErrorSeverity.HIGH }, this.handleHighSeverityError);
    this.route({ severity: ErrorSeverity.MEDIUM }, this.handleMediumSeverityError);
    this.route({ severity: ErrorSeverity.LOW }, this.handleLowSeverityError);

    // Route by category
    this.route({ category: 'generation' }, this.handleGenerationError);
    this.route({ category: 'environment' }, this.handleEnvironmentError);

    // Route by recoverability
    this.route({ recoverable: true }, this.handleRecoverableError);
    this.route({ recoverable: false }, this.handleUnrecoverableError);
  }

  /**
   * Add routing rule
   */
  route(criteria, handler) {
    const routeId = `route_${this.routes.size}`;
    this.routes.set(routeId, { criteria, handler: handler.bind(this) });
    return this;
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Route error to appropriate handler
   */
  async routeError(error, context = {}) {
    const classification = this.classifier.classify(error);
    const enrichedError = { ...error, classification };

    // Apply middleware
    let processedError = enrichedError;
    for (const middleware of this.middleware) {
      processedError = await middleware(processedError, context) || processedError;
    }

    // Find matching routes
    for (const [, route] of this.routes) {
      if (this.matchesCriteria(classification, route.criteria)) {
        const result = await route.handler(processedError, context);
        if (result) {
          return result;
        }
      }
    }

    // No route found, return original error
    return processedError;
  }

  /**
   * Check if classification matches criteria
   */
  matchesCriteria(classification, criteria) {
    for (const [key, value] of Object.entries(criteria)) {
      if (classification[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Default error handlers
   */
  async handleCriticalError(error, context) {
    console.error('CRITICAL ERROR:', error);
    // Could send to monitoring service
    return error;
  }

  async handleHighSeverityError(error, context) {
    console.error('HIGH SEVERITY ERROR:', error);
    return error;
  }

  async handleMediumSeverityError(error, context) {
    console.warn('MEDIUM SEVERITY ERROR:', error);
    return error;
  }

  async handleLowSeverityError(error, context) {
    console.info('LOW SEVERITY ERROR:', error);
    return error;
  }

  async handleGenerationError(error, context) {
    // Generation-specific handling
    if (error.code === QRCodeGenerationError.CODES.DATA_TOO_LONG) {
      return this.suggestDataOptimization(error, context);
    }
    return error;
  }


  async handleEnvironmentError(error, context) {
    // Environment-specific handling
    return error;
  }

  async handleRecoverableError(error, context) {
    // Add recovery suggestions
    error.suggestions = this.generateRecoverySuggestions(error);
    return error;
  }

  async handleUnrecoverableError(error, context) {
    // Log unrecoverable errors for analysis
    console.error('Unrecoverable error:', error);
    return error;
  }

  /**
   * Generate recovery suggestions
   */
  generateRecoverySuggestions(error) {
    const suggestions = [];

    switch (error.code) {
      case QRCodeGenerationError.CODES.DATA_TOO_LONG:
        suggestions.push('Try reducing the data length');
        suggestions.push('Use a higher error correction level');
        break;
    }

    return suggestions;
  }

  /**
   * Helper methods for specific error types
   */
  suggestDataOptimization(error, context) {
    error.optimization = {
      currentLength: context.input?.data?.length || 0,
      maxLength: 2900,
      suggestions: [
        'Consider using URL shortening services',
        'Remove unnecessary characters',
        'Use numeric mode for numbers'
      ]
    };
    return error;
  }

}