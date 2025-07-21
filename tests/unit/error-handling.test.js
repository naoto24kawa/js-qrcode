import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ErrorHandlerRegistry, 
  ErrorContext, 
  ErrorFactory, 
  ErrorAnalytics,
  QRCodeGenerationError,
  QRCodeDecodeError
} from '../../src/errors.js';
import { ErrorRouter, ErrorClassifier, ErrorSeverity } from '../../src/error-router.js';

describe('Error Handling System', () => {
  
  describe('ErrorHandlerRegistry', () => {
    let registry;
    
    beforeEach(() => {
      registry = new ErrorHandlerRegistry();
    });
    
    it('should register and execute specific error code handlers', async () => {
      const handler = vi.fn((error) => ({ ...error, handled: true }));
      registry.register('TEST_ERROR', handler);
      
      const error = new QRCodeGenerationError('Test', 'TEST_ERROR');
      const result = await registry.handle(error);
      
      expect(handler).toHaveBeenCalledWith(error, {});
      expect(result.handled).toBe(true);
    });
    
    it('should register and execute type-based handlers', async () => {
      const handler = vi.fn((error) => ({ ...error, typeHandled: true }));
      registry.registerForType(QRCodeGenerationError, handler);
      
      const error = new QRCodeGenerationError('Test', 'ANY_CODE');
      const result = await registry.handle(error);
      
      expect(handler).toHaveBeenCalledWith(error, {});
      expect(result.typeHandled).toBe(true);
    });
    
    it('should execute global handlers as fallback', async () => {
      const globalHandler = vi.fn((error) => ({ ...error, globalHandled: true }));
      registry.registerGlobal(globalHandler);
      
      const error = new QRCodeGenerationError('Test', 'UNKNOWN_CODE');
      const result = await registry.handle(error);
      
      expect(globalHandler).toHaveBeenCalledWith(error, {});
      expect(result.globalHandled).toBe(true);
    });
    
    it('should execute middleware in order', async () => {
      const middleware1 = vi.fn((error) => ({ ...error, step1: true }));
      const middleware2 = vi.fn((error) => ({ ...error, step2: true }));
      
      registry.use(middleware1);
      registry.use(middleware2);
      
      const error = new QRCodeGenerationError('Test', 'TEST_ERROR');
      await registry.handle(error);
      
      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
    
    it('should handle handler failures gracefully', async () => {
      const failingHandler = vi.fn(() => {
        throw new Error('Handler failed');
      });
      const fallbackHandler = vi.fn((error) => ({ ...error, fallback: true }));
      
      registry.register('TEST_ERROR', failingHandler);
      registry.registerGlobal(fallbackHandler);
      
      const error = new QRCodeGenerationError('Test', 'TEST_ERROR');
      const result = await registry.handle(error);
      
      expect(result.fallback).toBe(true);
    });
    
    it('should provide handlers information', () => {
      registry.register('CODE1', () => {});
      registry.registerForType(QRCodeGenerationError, () => {});
      registry.registerGlobal(() => {});
      registry.use(() => {});
      
      const info = registry.getHandlersInfo();
      
      expect(info.specific).toContain('CODE1');
      expect(info.specific).toContain('QRCodeGenerationError');
      expect(info.global).toBe(1);
      expect(info.middleware).toBe(1);
    });
  });
  
  describe('ErrorContext', () => {
    it('should build comprehensive context information', () => {
      const context = new ErrorContext()
        .withOperation('test-operation')
        .withInput({ data: 'test' })
        .withUser('user123', 'session456')
        .withMetrics(Date.now() - 100, 1024)
        .withEnvironment({ platform: 'test' })
        .withCustom('version', '1.0');
      
      const built = context.build();
      
      expect(built.operation).toBe('test-operation');
      expect(built.input.data).toBe('test');
      expect(built.user.userId).toBe('user123');
      expect(built.user.sessionId).toBe('session456');
      expect(built.metrics.memoryUsage).toBe(1024);
      expect(built.environment.platform).toBe('test');
      expect(built.custom.version).toBe('1.0');
    });
    
    it('should handle method chaining', () => {
      const context = new ErrorContext();
      const result = context
        .withOperation('test')
        .withInput({ test: true });
      
      expect(result).toBe(context);
      expect(context.data.operation).toBe('test');
      expect(context.data.input.test).toBe(true);
    });
  });
  
  describe('ErrorFactory', () => {
    it('should create generation errors with context', () => {
      const context = new ErrorContext().withOperation('generate');
      const error = ErrorFactory.createGenerationError(
        'DATA_TOO_LONG',
        'Data too long',
        { dataLength: 3000 },
        context
      );
      
      expect(error).toBeInstanceOf(QRCodeGenerationError);
      expect(error.code).toBe('DATA_TOO_LONG');
      expect(error.details.category).toBe('generation');
      expect(error.details.context.operation).toBe('generate');
      expect(error.details.dataLength).toBe(3000);
    });
    
    it('should create decode errors with context', () => {
      const context = new ErrorContext().withOperation('decode');
      const error = ErrorFactory.createDecodeError(
        'NO_QR_FOUND',
        'No QR found',
        {},
        context
      );
      
      expect(error).toBeInstanceOf(QRCodeDecodeError);
      expect(error.code).toBe('NO_QR_FOUND');
      expect(error.details.category).toBe('decode');
      expect(error.details.context.operation).toBe('decode');
    });
    
    it('should handle context objects and plain objects', () => {
      const plainContext = { operation: 'test' };
      const error = ErrorFactory.createGenerationError(
        'TEST_CODE',
        'Test message',
        {},
        plainContext
      );
      
      expect(error.details.context.operation).toBe('test');
    });
  });
  
  describe('ErrorAnalytics', () => {
    let analytics;
    
    beforeEach(() => {
      analytics = new ErrorAnalytics();
    });
    
    it('should track error occurrences', () => {
      const error = new QRCodeGenerationError('Test', 'TEST_CODE');
      const context = { operation: 'test' };
      
      const id = analytics.track(error, context);
      
      expect(typeof id).toBe('string');
      expect(analytics.errors).toHaveLength(1);
      expect(analytics.errors[0].error).toBe(error);
      expect(analytics.errors[0].context).toBe(context);
    });
    
    it('should update metrics correctly', () => {
      const error1 = new QRCodeGenerationError('Test 1', 'CODE_A');
      const error2 = new QRCodeGenerationError('Test 2', 'CODE_B');
      const error3 = new QRCodeDecodeError('Test 3', 'CODE_A');
      
      analytics.track(error1);
      analytics.track(error2);
      analytics.track(error3);
      
      const stats = analytics.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType.QRCodeGenerationError).toBe(2);
      expect(stats.byType.QRCodeDecodeError).toBe(1);
      expect(stats.byCode.CODE_A).toBe(2);
      expect(stats.byCode.CODE_B).toBe(1);
    });
    
    it('should filter errors by criteria', () => {
      const error1 = new QRCodeGenerationError('Test 1', 'CODE_A');
      const error2 = new QRCodeDecodeError('Test 2', 'CODE_B');
      
      analytics.track(error1);
      analytics.track(error2);
      
      const generationErrors = analytics.getErrors({ 
        type: 'QRCodeGenerationError' 
      });
      const codeAErrors = analytics.getErrors({ 
        code: 'CODE_A' 
      });
      
      expect(generationErrors).toHaveLength(1);
      expect(generationErrors[0].error).toBe(error1);
      expect(codeAErrors).toHaveLength(1);
      expect(codeAErrors[0].error).toBe(error1);
    });
    
    it('should limit stored errors to 1000', () => {
      // Create 1100 errors
      for (let i = 0; i < 1100; i++) {
        const error = new QRCodeGenerationError(`Test ${i}`, 'TEST_CODE');
        analytics.track(error);
      }
      
      expect(analytics.errors).toHaveLength(1000);
      expect(analytics.metrics.total).toBe(1100);
    });
    
    it('should clear all data', () => {
      analytics.track(new QRCodeGenerationError('Test', 'TEST_CODE'));
      analytics.clear();
      
      expect(analytics.errors).toHaveLength(0);
      expect(analytics.metrics.total).toBe(0);
      expect(analytics.patterns.size).toBe(0);
    });
  });
  
  describe('ErrorClassifier', () => {
    let classifier;
    
    beforeEach(() => {
      classifier = new ErrorClassifier();
    });
    
    it('should classify error severity', () => {
      const highError = new QRCodeGenerationError('Test', 'RENDERING_FAILED');
      const mediumError = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      const lowError = new QRCodeDecodeError('Test', 'NO_QR_FOUND');
      
      expect(classifier.getSeverity(highError)).toBe(ErrorSeverity.HIGH);
      expect(classifier.getSeverity(mediumError)).toBe(ErrorSeverity.MEDIUM);
      expect(classifier.getSeverity(lowError)).toBe(ErrorSeverity.LOW);
    });
    
    it('should classify error categories', () => {
      const genError = new QRCodeGenerationError('Test', 'TEST_CODE');
      const decError = new QRCodeDecodeError('Test', 'TEST_CODE');
      
      expect(classifier.getCategory(genError)).toBe('generation');
      expect(classifier.getCategory(decError)).toBe('decode');
    });
    
    it('should identify recoverable errors', () => {
      const recoverableError = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      const unrecoverableError = new QRCodeGenerationError('Test', 'ENCODING_FAILED');
      
      expect(classifier.isRecoverable(recoverableError)).toBe(true);
      expect(classifier.isRecoverable(unrecoverableError)).toBe(false);
    });
    
    it('should identify user-facing errors', () => {
      const userFacingError = new QRCodeDecodeError('Test', 'NO_QR_FOUND');
      const internalError = new QRCodeGenerationError('Test', 'ENCODING_FAILED');
      
      expect(classifier.isUserFacing(userFacingError)).toBe(true);
      expect(classifier.isUserFacing(internalError)).toBe(false);
    });
    
    it('should identify retryable errors', () => {
      const retryableError = new QRCodeGenerationError('Test', 'RENDERING_FAILED');
      const nonRetryableError = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      
      expect(classifier.isRetryable(retryableError)).toBe(true);
      expect(classifier.isRetryable(nonRetryableError)).toBe(false);
    });
    
    it('should provide complete classification', () => {
      const error = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      const classification = classifier.classify(error);
      
      expect(classification).toEqual({
        severity: ErrorSeverity.MEDIUM,
        category: 'generation',
        recoverable: true,
        userFacing: true,
        retryable: false
      });
    });
    
    it('should allow custom severity rules', () => {
      classifier.addSeverityRule('CUSTOM_CODE', ErrorSeverity.CRITICAL);
      const error = new QRCodeGenerationError('Test', 'CUSTOM_CODE');
      
      expect(classifier.getSeverity(error)).toBe(ErrorSeverity.CRITICAL);
    });
  });
  
  describe('ErrorRouter', () => {
    let router;
    
    beforeEach(() => {
      router = new ErrorRouter();
    });
    
    it('should route errors by severity', async () => {
      const criticalHandler = vi.spyOn(router, 'handleCriticalError');
      const error = new QRCodeGenerationError('Test', 'ENCODING_FAILED');
      
      // Set error as critical
      router.classifier.addSeverityRule('ENCODING_FAILED', ErrorSeverity.CRITICAL);
      
      await router.routeError(error);
      
      expect(criticalHandler).toHaveBeenCalledWith(
        expect.objectContaining({ 
          code: 'ENCODING_FAILED',
          classification: expect.objectContaining({ 
            severity: ErrorSeverity.CRITICAL 
          })
        }),
        {}
      );
    });
    
    it('should route errors by category', async () => {
      const generationHandler = vi.spyOn(router, 'handleGenerationError');
      const error = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      
      await router.routeError(error);
      
      expect(generationHandler).toHaveBeenCalled();
    });
    
    it('should apply middleware before routing', async () => {
      const middleware = vi.fn((error) => ({ ...error, middleware: true }));
      router.use(middleware);
      
      const error = new QRCodeGenerationError('Test', 'TEST_CODE');
      const result = await router.routeError(error);
      
      expect(middleware).toHaveBeenCalled();
      expect(result.middleware).toBe(true);
    });
    
    it('should add custom routes', async () => {
      const customHandler = vi.fn((error) => ({ ...error, custom: true }));
      router.route({ category: 'generation' }, customHandler);
      
      const error = new QRCodeGenerationError('Test', 'TEST_CODE');
      const result = await router.routeError(error);
      
      expect(customHandler).toHaveBeenCalled();
      expect(result.custom).toBe(true);
    });
    
    it('should provide recovery suggestions', async () => {
      const error = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      const result = await router.routeError(error);
      
      expect(result.suggestions).toContain('Try reducing the data length');
      expect(result.suggestions).toContain('Use a higher error correction level');
    });
    
    it('should add optimization suggestions for specific errors', async () => {
      const error = new QRCodeGenerationError('Test', 'DATA_TOO_LONG');
      const context = { input: { dataLength: 3000 } };
      
      const result = await router.routeError(error, context);
      
      expect(result.optimization).toBeDefined();
      expect(result.optimization.currentLength).toBe(3000);
      expect(result.optimization.maxLength).toBe(2900);
      expect(result.optimization.suggestions).toContain('Consider using URL shortening services');
    });
  });
  
  describe('Integration Tests', () => {
    it('should work together in a complete error handling flow', async () => {
      const registry = new ErrorHandlerRegistry();
      const analytics = new ErrorAnalytics();
      const router = new ErrorRouter();
      
      // Set up custom handler
      const customHandler = vi.fn((error, context) => {
        return { ...error, handled: true };
      });
      registry.register('DATA_TOO_LONG', customHandler);
      
      // Create error with context
      const context = new ErrorContext()
        .withOperation('generate')
        .withInput({ dataLength: 3000 });
      
      const error = ErrorFactory.createGenerationError(
        'DATA_TOO_LONG',
        'Data too long',
        {},
        context
      );
      
      // Track error
      analytics.track(error, context.build());
      
      // Route error
      const routedError = await router.routeError(error, context.build());
      
      // Handle error
      const handledError = await registry.handle(routedError, context.build());
      
      // Verify complete flow
      expect(handledError.handled).toBe(true);
      expect(handledError.suggestions).toBeDefined();
      expect(handledError.optimization).toBeDefined();
      expect(analytics.getStats().total).toBe(1);
    });
  });
});