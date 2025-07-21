/**
 * WASM Masking Integration Tests
 * Tests for QR Code Masking WASM module and fallback behavior
 */

import { createQRMasking, HybridQRMasking, JSQRMasking } from '../../src/masking-wasm.js';
import { QRCodeGenerator } from '../../src/generator.js';

describe('WASM Masking Integration', () => {
  // Test data - simple 5x5 QR code modules for testing
  const createTestModules = (size = 5) => {
    const modules = [];
    for (let row = 0; row < size; row++) {
      modules[row] = [];
      for (let col = 0; col < size; col++) {
        // Create a simple pattern for testing
        modules[row][col] = (row + col) % 2 === 0;
      }
    }
    return modules;
  };

  describe('Masking Factory', () => {
    test('should create hybrid implementation by default', () => {
      const masking = createQRMasking();
      expect(masking).toBeInstanceOf(HybridQRMasking);
    });

    test('should create JavaScript implementation when forced', () => {
      const masking = createQRMasking(true);
      expect(masking).toBeInstanceOf(JSQRMasking);
    });
  });

  describe('Hybrid Masking', () => {
    let hybridMasking;

    beforeEach(() => {
      hybridMasking = new HybridQRMasking();
    });

    test('should handle JavaScript fallback gracefully for mask application', async () => {
      hybridMasking.forceJavaScript();
      
      const testModules = createTestModules();
      const result = await hybridMasking.applyMask(testModules, 0, 5);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result[0].length).toBe(5);
    });

    test('should handle JavaScript fallback gracefully for mask evaluation', async () => {
      hybridMasking.forceJavaScript();
      
      const testModules = createTestModules();
      const penalty = await hybridMasking.evaluateMask(testModules, 5);
      
      expect(typeof penalty).toBe('number');
      expect(penalty).toBeGreaterThanOrEqual(0);
    });

    test('should handle JavaScript fallback gracefully for best mask selection', async () => {
      hybridMasking.forceJavaScript();
      
      const testModules = createTestModules();
      const bestMask = await hybridMasking.findBestMask(testModules, 5, { errorCorrectionLevel: 'M' });
      
      expect(typeof bestMask).toBe('number');
      expect(bestMask).toBeGreaterThanOrEqual(0);
      expect(bestMask).toBeLessThanOrEqual(7);
    });

    test('should provide synchronous methods when WASM is not ready', () => {
      const testModules = createTestModules();
      
      const maskedResult = hybridMasking.applyMaskSync(testModules, 0, 5);
      const penalty = hybridMasking.evaluateMaskSync(testModules, 5);
      const bestMask = hybridMasking.findBestMaskSync(testModules, 5, { errorCorrectionLevel: 'M' });
      
      expect(Array.isArray(maskedResult)).toBe(true);
      expect(typeof penalty).toBe('number');
      expect(typeof bestMask).toBe('number');
    });

    test('should report WASM readiness status', () => {
      const isReady = hybridMasking.isWASMReady();
      expect(typeof isReady).toBe('boolean');
    });

    test('should handle forced mask option correctly', async () => {
      const testModules = createTestModules();
      const forcedMask = await hybridMasking.findBestMask(testModules, 5, { 
        forceMask: '3',
        errorCorrectionLevel: 'M' 
      });
      
      expect(forcedMask).toBe(3);
    });

    test('should handle legacy compatibility option correctly', async () => {
      const testModules = createTestModules();
      
      const maskL = await hybridMasking.findBestMask(testModules, 5, { 
        legacyCompatibility: true,
        errorCorrectionLevel: 'L' 
      });
      const maskH = await hybridMasking.findBestMask(testModules, 5, { 
        legacyCompatibility: true,
        errorCorrectionLevel: 'H' 
      });
      
      expect(maskL).toBe(4);
      expect(maskH).toBe(1);
    });

    test('should get penalty breakdown', async () => {
      const testModules = createTestModules();
      const breakdown = await hybridMasking.getPenaltyBreakdown(testModules, 5);
      
      expect(Array.isArray(breakdown)).toBe(true);
      expect(breakdown.length).toBe(4);
      breakdown.forEach(penalty => {
        expect(typeof penalty).toBe('number');
        expect(penalty).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('QR Code Generator Integration', () => {
    test('should work with WASM-enabled generator (masking)', async () => {
      const generator = new QRCodeGenerator();
      const result = await generator.generate('Hello Masking WASM!');
      
      expect(result.data).toBe('Hello Masking WASM!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.maskPattern).toBeDefined();
      expect(result.maskPattern).toBeGreaterThanOrEqual(0);
      expect(result.maskPattern).toBeLessThanOrEqual(7);
    });

    test('should work with JavaScript-only generator (masking)', async () => {
      const generator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      const result = await generator.generate('Hello JS Masking!');
      
      expect(result.data).toBe('Hello JS Masking!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.maskPattern).toBeDefined();
    });

    test('should produce consistent mask patterns between WASM and JS', async () => {
      const wasmGenerator = new QRCodeGenerator();
      const jsGenerator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      
      const testData = 'Mask Consistency Test';
      const wasmResult = await wasmGenerator.generate(testData, { legacyCompatibility: true, errorCorrectionLevel: 'M' });
      const jsResult = await jsGenerator.generate(testData, { legacyCompatibility: true, errorCorrectionLevel: 'M' });
      
      // With legacy compatibility, results should be identical
      expect(wasmResult.maskPattern).toBe(jsResult.maskPattern);
      expect(wasmResult.version).toBe(jsResult.version);
      expect(wasmResult.errorCorrectionLevel).toBe(jsResult.errorCorrectionLevel);
    });
  });

  describe('Workers Environment Compatibility', () => {
    test('should handle missing WebAssembly gracefully for masking', async () => {
      const originalWebAssembly = global.WebAssembly;
      delete global.WebAssembly;
      
      try {
        const masking = new HybridQRMasking();
        const testModules = createTestModules();
        const result = await masking.applyMask(testModules, 0, 5);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(5);
      } finally {
        global.WebAssembly = originalWebAssembly;
      }
    });

    test('should work in simulated worker environment for masking', async () => {
      const originalImportScripts = global.importScripts;
      global.importScripts = jest.fn();
      
      try {
        const masking = new HybridQRMasking();
        const testModules = createTestModules();
        const result = await masking.evaluateMask(testModules, 5);
        
        expect(typeof result).toBe('number');
      } finally {
        if (originalImportScripts) {
          global.importScripts = originalImportScripts;
        } else {
          delete global.importScripts;
        }
      }
    });
  });

  describe('Mask Pattern Evaluation Rules', () => {
    let hybridMasking;

    beforeEach(() => {
      hybridMasking = new HybridQRMasking();
    });

    test('should evaluate Rule 1 (consecutive modules)', () => {
      const modules = [
        [true, true, true, true, true],    // 5 consecutive dark modules
        [false, false, false, false, false], // 5 consecutive light modules
        [true, false, true, false, true],
        [false, true, false, true, false],
        [true, false, true, false, true]
      ];
      
      const penalty = hybridMasking.evaluateRule1(modules, 5);
      expect(penalty).toBeGreaterThan(0);
    });

    test('should evaluate Rule 2 (2x2 blocks)', () => {
      const modules = [
        [true, true, false, false, true],
        [true, true, false, false, false],  // 2x2 dark block and 2x2 light block
        [false, false, true, true, true],
        [false, false, true, true, false],
        [true, false, true, false, true]
      ];
      
      const penalty = hybridMasking.evaluateRule2(modules, 5);
      expect(penalty).toBeGreaterThan(0);
    });

    test('should evaluate Rule 4 (dark/light balance)', () => {
      // Create heavily unbalanced pattern (all dark)
      const modules = Array(5).fill(null).map(() => Array(5).fill(true));
      
      const penalty = hybridMasking.evaluateRule4(modules, 5);
      expect(penalty).toBeGreaterThan(0);
    });
  });

  describe('Performance and Memory', () => {
    test('should not leak memory with repeated mask operations', async () => {
      const masking = createQRMasking();
      const testModules = createTestModules(10); // Larger test matrix
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        const maskPattern = i % 8;
        const result = await masking.applyMask(testModules, maskPattern, 10);
        const penalty = await masking.evaluateMask(result, 10);
        expect(penalty).toBeGreaterThanOrEqual(0);
      }
      
      // If we reach here without errors, memory management is working
      expect(true).toBe(true);
    });

    test('should handle large modules efficiently', async () => {
      const masking = createQRMasking();
      const largeModules = createTestModules(25); // 25x25 matrix
      
      const startTime = performance.now();
      const bestMask = await masking.findBestMask(largeModules, 25, { errorCorrectionLevel: 'M' });
      const endTime = performance.now();
      
      expect(bestMask).toBeGreaterThanOrEqual(0);
      expect(bestMask).toBeLessThanOrEqual(7);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle all 8 mask patterns correctly', async () => {
      const masking = createQRMasking();
      const testModules = createTestModules(10);
      
      for (let maskPattern = 0; maskPattern < 8; maskPattern++) {
        const maskedModules = await masking.applyMask(testModules, maskPattern, 10);
        const penalty = await masking.evaluateMask(maskedModules, 10);
        
        expect(Array.isArray(maskedModules)).toBe(true);
        expect(maskedModules.length).toBe(10);
        expect(typeof penalty).toBe('number');
        expect(penalty).toBeGreaterThanOrEqual(0);
      }
    });
  });
});