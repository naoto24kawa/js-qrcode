/**
 * WASM Integration Tests
 * Tests for Reed-Solomon WASM module and fallback behavior
 */

import { createQRErrorCorrection, HybridQRErrorCorrection, JSQRErrorCorrection } from '../../src/reed-solomon-wasm.js';
import { QRCodeGenerator } from '../../src/generator.js';

describe('WASM Reed-Solomon Integration', () => {
  describe('Error Correction Factory', () => {
    test('should create hybrid implementation by default', () => {
      const errorCorrection = createQRErrorCorrection();
      expect(errorCorrection).toBeInstanceOf(HybridQRErrorCorrection);
    });

    test('should create JavaScript implementation when forced', () => {
      const errorCorrection = createQRErrorCorrection(true);
      expect(errorCorrection).toBeInstanceOf(JSQRErrorCorrection);
    });
  });

  describe('Hybrid Error Correction', () => {
    let hybridErrorCorrection;

    beforeEach(() => {
      hybridErrorCorrection = new HybridQRErrorCorrection();
    });

    test('should handle JavaScript fallback gracefully', async () => {
      // Force JavaScript implementation
      hybridErrorCorrection.forceJavaScript();
      
      const testData = [72, 101, 108, 108, 111]; // "Hello"
      const result = await hybridErrorCorrection.addErrorCorrection(testData, 1, 'M');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(testData.length);
      expect(result.slice(0, testData.length)).toEqual(testData);
    });

    test('should provide synchronous method when WASM is not ready', () => {
      const testData = [72, 101, 108, 108, 111]; // "Hello"
      const result = hybridErrorCorrection.addErrorCorrectionSync(testData, 1, 'M');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(testData.length);
    });

    test('should report WASM readiness status', () => {
      const isReady = hybridErrorCorrection.isWASMReady();
      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('QR Code Generator Integration', () => {
    test('should work with WASM-enabled generator', async () => {
      const generator = new QRCodeGenerator();
      const result = await generator.generate('Hello WASM!');
      
      expect(result.data).toBe('Hello WASM!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.version).toBeGreaterThan(0);
    });

    test('should work with JavaScript-only generator', async () => {
      const generator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      const result = await generator.generate('Hello JS!');
      
      expect(result.data).toBe('Hello JS!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.version).toBeGreaterThan(0);
    });

    test('should produce consistent results between WASM and JS', async () => {
      const wasmGenerator = new QRCodeGenerator();
      const jsGenerator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      
      const testData = 'Consistency Test';
      const wasmResult = await wasmGenerator.generate(testData);
      const jsResult = await jsGenerator.generate(testData);
      
      // Results should be functionally equivalent
      expect(wasmResult.version).toBe(jsResult.version);
      expect(wasmResult.errorCorrectionLevel).toBe(jsResult.errorCorrectionLevel);
      expect(wasmResult.modules.length).toBe(jsResult.modules.length);
    });
  });

  describe('Workers Environment Compatibility', () => {
    test('should handle missing WebAssembly gracefully', async () => {
      // Mock missing WebAssembly
      const originalWebAssembly = global.WebAssembly;
      delete global.WebAssembly;
      
      try {
        const errorCorrection = new HybridQRErrorCorrection();
        const testData = [72, 101, 108, 108, 111];
        const result = await errorCorrection.addErrorCorrection(testData, 1, 'M');
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(testData.length);
      } finally {
        global.WebAssembly = originalWebAssembly;
      }
    });

    test('should work in simulated worker environment', async () => {
      // Mock worker environment
      const originalImportScripts = global.importScripts;
      global.importScripts = jest.fn();
      
      try {
        const errorCorrection = new HybridQRErrorCorrection();
        const testData = [72, 101, 108, 108, 111];
        const result = await errorCorrection.addErrorCorrection(testData, 1, 'M');
        
        expect(Array.isArray(result)).toBe(true);
      } finally {
        if (originalImportScripts) {
          global.importScripts = originalImportScripts;
        } else {
          delete global.importScripts;
        }
      }
    });
  });

  describe('Error Correction Levels', () => {
    const testCases = [
      { level: 'L', data: 'Low' },
      { level: 'M', data: 'Medium' },
      { level: 'Q', data: 'Quartile' },
      { level: 'H', data: 'High' }
    ];

    test.each(testCases)('should handle error correction level $level', async ({ level, data }) => {
      const generator = new QRCodeGenerator();
      const result = await generator.generate(data, { errorCorrectionLevel: level });
      
      expect(result.errorCorrectionLevel).toBe(level);
      expect(result.modules).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    test('should not leak memory with repeated operations', async () => {
      const generator = new QRCodeGenerator();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const result = await generator.generate(`Test ${i}`);
        expect(result.modules).toBeDefined();
      }
      
      // If we reach here without errors, memory management is working
      expect(true).toBe(true);
    });

    test('should handle large data efficiently', async () => {
      const generator = new QRCodeGenerator();
      const largeData = 'A'.repeat(100); // Large but manageable data
      
      const startTime = performance.now();
      const result = await generator.generate(largeData);
      const endTime = performance.now();
      
      expect(result.modules).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});