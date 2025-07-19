import { QRCodeEncoder } from '../../src/encoder.js';
import { TEST_DATA, EXPECTED_MODES } from '../helpers/test-data.js';

describe('QRCodeEncoder - Version Determination', () => {
  let encoder;
  
  beforeEach(() => {
    encoder = new QRCodeEncoder();
  });

  describe('determineVersion', () => {
    test('should determine version 1 for short alphanumeric data', () => {
      const version = encoder.determineVersion(
        TEST_DATA.ALPHANUMERIC.SHORT, 
        EXPECTED_MODES.ALPHANUMERIC, 
        'M'
      );
      expect(version).toBe(1);
    });

    test('should determine higher version for longer data', () => {
      const longData = 'A'.repeat(30);
      const version = encoder.determineVersion(
        longData, 
        EXPECTED_MODES.ALPHANUMERIC, 
        'M'
      );
      expect(version).toBeGreaterThan(1);
    });

    test('should handle different error correction levels', () => {
      const data = TEST_DATA.ALPHANUMERIC.MEDIUM;
      const mode = EXPECTED_MODES.ALPHANUMERIC;
      
      const versionL = encoder.determineVersion(data, mode, 'L');
      const versionH = encoder.determineVersion(data, mode, 'H');
      
      expect(versionL).toBeGreaterThanOrEqual(1);
      expect(versionH).toBeGreaterThanOrEqual(versionL);
    });
  });
});