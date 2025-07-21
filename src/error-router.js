/**
 * Simple error handling utilities for QR Code generation
 */

import { 
  QRCodeGenerationError, 
  EnvironmentError,
  ValidationError 
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
 * Simple error classifier
 */
export class ErrorClassifier {
  /**
   * Classify error by type and severity
   */
  static classify(error) {
    if (error instanceof ValidationError) {
      return {
        category: 'validation',
        severity: ErrorSeverity.MEDIUM,
        userFriendly: true,
        retryable: false
      };
    }
    
    if (error instanceof EnvironmentError) {
      return {
        category: 'environment',
        severity: ErrorSeverity.HIGH,
        userFriendly: true,
        retryable: false
      };
    }
    
    if (error instanceof QRCodeGenerationError) {
      return {
        category: 'generation',
        severity: ErrorSeverity.MEDIUM,
        userFriendly: true,
        retryable: true
      };
    }
    
    // Generic error
    return {
      category: 'unknown',
      severity: ErrorSeverity.LOW,
      userFriendly: false,
      retryable: false
    };
  }
}

/**
 * Simple error router
 */
export class ErrorRouter {
  /**
   * Handle error based on classification
   */
  static handle(error, options = {}) {
    const classification = ErrorClassifier.classify(error);
    
    switch (classification.severity) {
      case ErrorSeverity.CRITICAL:
        throw error;
        
      case ErrorSeverity.HIGH:
        if (options.throwOnHigh !== false) {
          throw error;
        }
        console.error('High severity error:', error.message);
        break;
        
      case ErrorSeverity.MEDIUM:
        if (options.throwOnMedium === true) {
          throw error;
        }
        console.warn('Medium severity error:', error.message);
        break;
        
      case ErrorSeverity.LOW:
      default:
        if (options.logLowSeverity !== false) {
          console.log('Low severity error:', error.message);
        }
        break;
    }
    
    return classification;
  }
}