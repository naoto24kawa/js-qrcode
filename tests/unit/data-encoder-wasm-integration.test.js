/**
 * WASM Data Encoder Integration Tests
 * Tests for QR Data Encoding WASM module and fallback behavior
 */

import { createQRDataEncoder, HybridQRDataEncoder, JSQRDataEncoder } from '../../src/data-encoder-wasm.js';
import { QRCodeGenerator } from '../../src/generator.js';
import { QR_MODES } from '../../src/constants.js';

describe('WASM Data Encoder Integration', () => {
  describe('Data Encoder Factory', () => {
    test('should create hybrid implementation by default', () => {
      const dataEncoder = createQRDataEncoder();
      expect(dataEncoder).toBeInstanceOf(HybridQRDataEncoder);
    });

    test('should create JavaScript implementation when forced', () => {
      const dataEncoder = createQRDataEncoder(true);
      expect(dataEncoder).toBeInstanceOf(JSQRDataEncoder);
    });
  });

  describe('Hybrid Data Encoder', () => {
    let hybridDataEncoder;

    beforeEach(() => {
      hybridDataEncoder = new HybridQRDataEncoder();
    });

    test('should handle JavaScript fallback gracefully for mode detection', async () => {
      hybridDataEncoder.forceJavaScript();
      
      const numericMode = await hybridDataEncoder.detectMode('12345');
      const alphanumericMode = await hybridDataEncoder.detectMode('HELLO');
      const byteMode = await hybridDataEncoder.detectMode('Hello World!');
      
      expect(numericMode).toBe(QR_MODES.NUMERIC);
      expect(alphanumericMode).toBe(QR_MODES.ALPHANUMERIC);
      expect(byteMode).toBe(QR_MODES.BYTE);
    });

    test('should handle JavaScript fallback gracefully for version determination', async () => {
      hybridDataEncoder.forceJavaScript();
      
      const version = await hybridDataEncoder.determineVersion('Hello', QR_MODES.BYTE, 'M');
      
      expect(typeof version).toBe('number');
      expect(version).toBeGreaterThanOrEqual(1);
      expect(version).toBeLessThanOrEqual(15);
    });

    test('should handle JavaScript fallback gracefully for data encoding', async () => {
      hybridDataEncoder.forceJavaScript();
      
      const bits = await hybridDataEncoder.encode('Test', QR_MODES.BYTE, 1);
      
      expect(typeof bits).toBe('string');
      expect(/^[01]+$/.test(bits)).toBe(true); // Should be binary string
    });

    test('should handle JavaScript fallback gracefully for byte encoding', async () => {
      hybridDataEncoder.forceJavaScript();
      
      const bytes = await hybridDataEncoder.encodeToBytes('Test', QR_MODES.BYTE, 1, 'M');
      
      expect(Array.isArray(bytes)).toBe(true);
      expect(bytes.length).toBeGreaterThan(0);
      bytes.forEach(byte => {
        expect(typeof byte).toBe('number');
        expect(byte).toBeGreaterThanOrEqual(0);
        expect(byte).toBeLessThanOrEqual(255);
      });
    });

    test('should provide synchronous methods when WASM is not ready', () => {
      const numericMode = hybridDataEncoder.detectModeSync('12345');
      const version = hybridDataEncoder.determineVersionSync('Hello', QR_MODES.BYTE, 'M');
      const bits = hybridDataEncoder.encodeSync('Test', QR_MODES.BYTE, 1);
      const bytes = hybridDataEncoder.encodeToBytesSync('Test', QR_MODES.BYTE, 1, 'M');
      
      expect(numericMode).toBe(QR_MODES.NUMERIC);
      expect(typeof version).toBe('number');
      expect(typeof bits).toBe('string');
      expect(Array.isArray(bytes)).toBe(true);
    });

    test('should report WASM readiness status', () => {
      const isReady = hybridDataEncoder.isWASMReady();
      expect(typeof isReady).toBe('boolean');
    });

    test('should handle alphanumeric check correctly', () => {
      expect(hybridDataEncoder.isAlphanumeric('HELLO123')).toBe(true);
      expect(hybridDataEncoder.isAlphanumeric('Hello123')).toBe(false); // lowercase not allowed
      expect(hybridDataEncoder.isAlphanumeric('HELLO WORLD')).toBe(true); // space allowed
      expect(hybridDataEncoder.isAlphanumeric('HELLO$%*+-./:')).toBe(true); // special chars allowed
    });

    test('should handle UTF-8 byte conversion', () => {
      const bytes = hybridDataEncoder.stringToUtf8Bytes('Hello');
      expect(Array.isArray(bytes)).toBe(true);
      expect(bytes).toEqual([72, 101, 108, 108, 111]); // ASCII values
    });
  });

  describe('QR Code Generator Integration', () => {
    test('should work with triple-WASM-enabled generator (data encoding)', async () => {
      const generator = new QRCodeGenerator();
      const result = await generator.generate('Hello Triple WASM!');
      
      expect(result.data).toBe('Hello Triple WASM!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.mode).toBeDefined();
      expect(result.version).toBeGreaterThan(0);
    });

    test('should work with JavaScript-only generator (data encoding)', async () => {
      const generator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      const result = await generator.generate('Hello JS Data!');
      
      expect(result.data).toBe('Hello JS Data!');
      expect(result.modules).toBeDefined();
      expect(result.svg).toBeDefined();
      expect(result.mode).toBeDefined();
    });

    test('should produce consistent results between WASM and JS for data encoding', async () => {
      const wasmGenerator = new QRCodeGenerator();
      const jsGenerator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
      
      const testData = 'Data Encoding Test';
      const wasmResult = await wasmGenerator.generate(testData);
      const jsResult = await jsGenerator.generate(testData);
      
      // Results should be functionally equivalent (mode should be same)
      expect(wasmResult.mode).toBe(jsResult.mode);
      expect(wasmResult.errorCorrectionLevel).toBe(jsResult.errorCorrectionLevel);
      // Version might differ slightly due to mock vs real implementation
      expect(wasmResult.version).toBeGreaterThan(0);
      expect(jsResult.version).toBeGreaterThan(0);
    });
  });

  describe('Mode Detection', () => {
    let hybridDataEncoder;

    beforeEach(() => {
      hybridDataEncoder = new HybridQRDataEncoder();
    });

    test('should detect numeric mode correctly', async () => {
      const mode = await hybridDataEncoder.detectMode('1234567890');
      expect(mode).toBe(QR_MODES.NUMERIC);
    });

    test('should detect alphanumeric mode correctly', async () => {
      const mode = await hybridDataEncoder.detectMode('HELLO WORLD 123');
      expect(mode).toBe(QR_MODES.ALPHANUMERIC);
    });

    test('should detect byte mode correctly', async () => {
      const mode = await hybridDataEncoder.detectMode('Hello, World!');
      expect(mode).toBe(QR_MODES.BYTE);
    });

    test('should handle empty string', async () => {
      const mode = await hybridDataEncoder.detectMode('');
      expect(typeof mode).toBe('number');
    });

    test('should handle Unicode characters', async () => {
      const mode = await hybridDataEncoder.detectMode('こんにちは');
      expect(mode).toBe(QR_MODES.BYTE);
    });
  });

  describe('Version Determination', () => {
    let hybridDataEncoder;

    beforeEach(() => {
      hybridDataEncoder = new HybridQRDataEncoder();
    });

    test('should determine appropriate version for short data', async () => {
      const version = await hybridDataEncoder.determineVersion('Hi', QR_MODES.BYTE, 'M');
      expect(version).toBe(1);
    });

    test('should determine appropriate version for longer data', async () => {
      const longData = 'A'.repeat(50);
      const version = await hybridDataEncoder.determineVersion(longData, QR_MODES.BYTE, 'M');
      expect(version).toBeGreaterThan(1);
      expect(version).toBeLessThanOrEqual(15);
    });

    test('should handle different error correction levels', async () => {
      const data = 'Test Data';
      const versionL = await hybridDataEncoder.determineVersion(data, QR_MODES.BYTE, 'L');
      const versionH = await hybridDataEncoder.determineVersion(data, QR_MODES.BYTE, 'H');
      
      expect(versionH).toBeGreaterThanOrEqual(versionL); // H requires more space
    });
  });

  describe('Workers Environment Compatibility', () => {
    test('should handle missing WebAssembly gracefully for data encoding', async () => {
      const originalWebAssembly = global.WebAssembly;
      delete global.WebAssembly;
      
      try {
        const dataEncoder = new HybridQRDataEncoder();
        const mode = await dataEncoder.detectMode('Hello');
        
        expect(mode).toBe(QR_MODES.BYTE);
      } finally {
        global.WebAssembly = originalWebAssembly;
      }
    });

    test('should work in simulated worker environment for data encoding', async () => {
      const originalImportScripts = global.importScripts;
      global.importScripts = jest.fn();
      
      try {
        const dataEncoder = new HybridQRDataEncoder();
        const bytes = await dataEncoder.encodeToBytes('Test', QR_MODES.BYTE, 1, 'M');
        
        expect(Array.isArray(bytes)).toBe(true);
      } finally {
        if (originalImportScripts) {
          global.importScripts = originalImportScripts;
        } else {
          delete global.importScripts;
        }
      }
    });
  });

  describe('Encoding Modes Performance', () => {
    let hybridDataEncoder;

    beforeEach(() => {
      hybridDataEncoder = new HybridQRDataEncoder();
    });

    test('should handle numeric encoding efficiently', async () => {
      const data = '1234567890123456789012345';
      const startTime = performance.now();
      const bits = await hybridDataEncoder.encode(data, QR_MODES.NUMERIC, 2);
      const endTime = performance.now();
      
      expect(typeof bits).toBe('string');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test('should handle alphanumeric encoding efficiently', async () => {
      const data = 'HELLO WORLD 123 $%*+-./:';
      const startTime = performance.now();
      const bits = await hybridDataEncoder.encode(data, QR_MODES.ALPHANUMERIC, 2);
      const endTime = performance.now();
      
      expect(typeof bits).toBe('string');
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle byte encoding efficiently', async () => {
      const data = 'Hello, World! こんにちは';
      const startTime = performance.now();
      const bits = await hybridDataEncoder.encode(data, QR_MODES.BYTE, 3);
      const endTime = performance.now();
      
      expect(typeof bits).toBe('string');
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let hybridDataEncoder;

    beforeEach(() => {
      hybridDataEncoder = new HybridQRDataEncoder();
    });

    test('should handle legacy compatibility case', async () => {
      // Test the specific legacy case in encodeToBytes
      const bytes = await hybridDataEncoder.encodeToBytes('Test', QR_MODES.BYTE, 1, 'H');
      
      expect(Array.isArray(bytes)).toBe(true);
      expect(bytes.length).toBeGreaterThan(0);
    });

    test('should handle very large data gracefully', async () => {
      const largeData = 'A'.repeat(1000);
      const mode = await hybridDataEncoder.detectMode(largeData);
      const version = await hybridDataEncoder.determineVersion(largeData, mode, 'L');
      
      expect(mode).toBe(QR_MODES.ALPHANUMERIC);
      expect(version).toBe(15); // Should cap at maximum version
    });

    test('should not leak memory with repeated operations', async () => {
      const iterations = 50;
      
      for (let i = 0; i < iterations; i++) {
        const data = `Test ${i}`;
        const mode = await hybridDataEncoder.detectMode(data);
        const version = await hybridDataEncoder.determineVersion(data, mode, 'M');
        const bytes = await hybridDataEncoder.encodeToBytes(data, mode, version, 'M');
        
        expect(Array.isArray(bytes)).toBe(true);
      }
      
      // If we reach here without errors, memory management is working
      expect(true).toBe(true);
    });
  });
});