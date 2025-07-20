import { QRDataEncoder } from '../../src/data-encoder.js';
import { EXPECTED_MODES } from '../helpers/test-data.js';
import { TestDataGenerator } from '../helpers/test-builders.js';

describe('QRDataEncoder - Mode Detection', () => {
  let encoder;
  
  beforeEach(() => {
    encoder = new QRDataEncoder();
  });

  describe('detectMode', () => {
    test.each(TestDataGenerator.generateModeTestCases())(
      'should detect $expected mode for $description: "$input"',
      ({ input, expected }) => {
        const result = encoder.detectMode(input);
        expect(result).toBe(EXPECTED_MODES[expected]);
      }
    );

    describe('edge cases', () => {
      test('should handle empty string', () => {
        expect(encoder.detectMode('')).toBe(EXPECTED_MODES.ALPHANUMERIC);
      });

      test('should handle single character', () => {
        expect(encoder.detectMode('5')).toBe(EXPECTED_MODES.NUMERIC);
        expect(encoder.detectMode('A')).toBe(EXPECTED_MODES.ALPHANUMERIC);
        expect(encoder.detectMode('a')).toBe(EXPECTED_MODES.BYTE);
      });

      test('should handle mixed content prioritization', () => {
        expect(encoder.detectMode('123ABC')).toBe(EXPECTED_MODES.ALPHANUMERIC);
        expect(encoder.detectMode('123abc')).toBe(EXPECTED_MODES.BYTE);
      });
    });
  });
});