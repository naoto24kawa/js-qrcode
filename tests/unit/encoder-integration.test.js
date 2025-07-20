import { QRCodeEncoder } from '../../src/encoder.js';
import { TEST_DATA, EXPECTED_MODES } from '../helpers/test-data.js';

describe('QRCodeEncoder - Integration', () => {
  let encoder;
  
  beforeEach(() => {
    encoder = new QRCodeEncoder();
  });

  describe('encode', () => {
    test('should encode numeric data end-to-end', () => {
      const result = encoder.encode(TEST_DATA.NUMERIC.SHORT, 'M');
      
      expect(result).toEqual({
        data: TEST_DATA.NUMERIC.SHORT,
        mode: EXPECTED_MODES.NUMERIC,
        version: 1,
        errorCorrectionLevel: 'M',
        maskPattern: expect.any(Number),
        modules: expect.any(Array),
        size: 21
      });
    });

    test('should encode alphanumeric data end-to-end', () => {
      const result = encoder.encode(TEST_DATA.ALPHANUMERIC.MEDIUM, 'M');
      
      expect(result).toEqual({
        data: TEST_DATA.ALPHANUMERIC.MEDIUM,
        mode: EXPECTED_MODES.ALPHANUMERIC,
        version: expect.any(Number),
        errorCorrectionLevel: 'M',
        maskPattern: expect.any(Number),
        modules: expect.any(Array),
        size: expect.any(Number)
      });
    });

    test('should encode byte data end-to-end', () => {
      const result = encoder.encode(TEST_DATA.BYTE.MEDIUM, 'M');
      
      expect(result).toEqual({
        data: TEST_DATA.BYTE.MEDIUM,
        mode: EXPECTED_MODES.BYTE,
        version: expect.any(Number),
        errorCorrectionLevel: 'M',
        maskPattern: expect.any(Number),
        modules: expect.any(Array),
        size: expect.any(Number)
      });
    });
  });

  describe('internal module generation', () => {
    test('should generate proper matrix size for encoded data', () => {
      const result = encoder.encode(TEST_DATA.NUMERIC.SHORT, 'M');
      
      expect(result.modules.length).toBe(21);
      expect(result.modules[0].length).toBe(21);
    });

    test('should include finder patterns', () => {
      const result = encoder.encode(TEST_DATA.NUMERIC.SHORT, 'M');
      const modules = result.modules;
      
      // Check corners for finder patterns
      expect(modules[0][0]).toBe(true);
      expect(modules[0][6]).toBe(true);
      expect(modules[6][0]).toBe(true);
      expect(modules[6][6]).toBe(true);
    });

    test('should generate different sizes for different data', () => {
      const result1 = encoder.encode(TEST_DATA.NUMERIC.SHORT, 'M');
      const result2 = encoder.encode('A'.repeat(50), 'M');
      
      expect(result2.modules.length).toBeGreaterThanOrEqual(result1.modules.length);
    });
  });
});