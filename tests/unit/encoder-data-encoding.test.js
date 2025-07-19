import { QRCodeEncoder } from '../../src/encoder.js';
import { TEST_DATA } from '../helpers/test-data.js';

describe('QRCodeEncoder - Data Encoding', () => {
  let encoder;
  
  beforeEach(() => {
    encoder = new QRCodeEncoder();
  });

  describe('encodeNumeric', () => {
    test('should encode numeric groups correctly', () => {
      const result = encoder.encodeNumeric(TEST_DATA.NUMERIC.LONG);
      expect(result).toMatch(/^[01]+$/);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle single digit', () => {
      const result = encoder.encodeNumeric('5');
      expect(result).toBe('0101');
    });

    test('should handle two digits', () => {
      const result = encoder.encodeNumeric('12');
      expect(result).toMatch(/^[01]{7}$/);
    });

    test('should handle three digits', () => {
      const result = encoder.encodeNumeric('123');
      expect(result).toMatch(/^[01]{10}$/);
    });
  });

  describe('encodeAlphanumeric', () => {
    test('should encode alphanumeric pairs correctly', () => {
      const result = encoder.encodeAlphanumeric('AB');
      expect(result).toMatch(/^[01]+$/);
      expect(result.length).toBe(11);
    });

    test('should handle single character', () => {
      const result = encoder.encodeAlphanumeric('A');
      expect(result).toMatch(/^[01]+$/);
      expect(result.length).toBe(6);
    });

    test('should handle longer strings', () => {
      const result = encoder.encodeAlphanumeric('HELLO');
      expect(result).toMatch(/^[01]+$/);
      expect(result.length).toBeGreaterThan(6);
    });
  });

  describe('encodeByte', () => {
    test('should encode single byte correctly', () => {
      const result = encoder.encodeByte('A');
      expect(result).toBe('01000001');
    });

    test('should encode multiple bytes', () => {
      const result = encoder.encodeByte('AB');
      expect(result).toBe('0100000101000010');
    });

    test('should handle unicode characters', () => {
      const result = encoder.encodeByte('α');
      expect(result).toMatch(/^[01]+$/);
      expect(result.length).toBeGreaterThanOrEqual(8); // Variable bytes for unicode
    });
  });
});