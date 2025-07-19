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

  describe('generateModules', () => {
    const dataBits = '1010101010';

    test('should generate proper matrix size for version 1', () => {
      const modules = encoder.generateModules(dataBits, 1, 'M');
      
      expect(modules.length).toBe(21);
      expect(modules[0].length).toBe(21);
    });

    test('should include finder patterns', () => {
      const modules = encoder.generateModules(dataBits, 1, 'M');
      
      // Check corners for finder patterns
      expect(modules[0][0]).toBe(true);
      expect(modules[0][6]).toBe(true);
      expect(modules[6][0]).toBe(true);
      expect(modules[6][6]).toBe(true);
    });

    test('should generate different sizes for different versions', () => {
      const modules1 = encoder.generateModules(dataBits, 1, 'M');
      const modules2 = encoder.generateModules(dataBits, 2, 'M');
      
      expect(modules2.length).toBeGreaterThan(modules1.length);
    });
  });
});