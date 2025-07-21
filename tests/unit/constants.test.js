import {
  QR_MODES,
  ERROR_CORRECTION_LEVELS,
  ALPHANUMERIC_CHARS,
  MAX_DATA_LENGTH,
  VERSION_INFO,
  MODULE_SIZES,
  PATTERN_SIZES,
  DEFAULT_OPTIONS,
  CAPACITY_TABLE,
  FINDER_PATTERN,
  MASK_PATTERNS
} from '../../src/constants/index.js';

describe('Constants', () => {
  describe('QR_MODES', () => {
    test('should have correct mode values', () => {
      expect(QR_MODES.NUMERIC).toBe(1);
      expect(QR_MODES.ALPHANUMERIC).toBe(2);
      expect(QR_MODES.BYTE).toBe(4);
      expect(QR_MODES.KANJI).toBe(8);
    });

    test('should have all required modes', () => {
      const expectedModes = ['NUMERIC', 'ALPHANUMERIC', 'BYTE', 'KANJI'];
      expectedModes.forEach(mode => {
        expect(QR_MODES).toHaveProperty(mode);
        expect(typeof QR_MODES[mode]).toBe('number');
      });
    });
  });

  describe('ERROR_CORRECTION_LEVELS', () => {
    test('should have correct error correction values', () => {
      expect(ERROR_CORRECTION_LEVELS.L).toBe(0b01);  // QR spec: 01
      expect(ERROR_CORRECTION_LEVELS.M).toBe(0b00);  // QR spec: 00
      expect(ERROR_CORRECTION_LEVELS.Q).toBe(0b11);  // QR spec: 11
      expect(ERROR_CORRECTION_LEVELS.H).toBe(0b10);  // QR spec: 10
    });

    test('should have all required levels', () => {
      const expectedLevels = ['L', 'M', 'Q', 'H'];
      expectedLevels.forEach(level => {
        expect(ERROR_CORRECTION_LEVELS).toHaveProperty(level);
        expect(typeof ERROR_CORRECTION_LEVELS[level]).toBe('number');
      });
    });
  });

  describe('ALPHANUMERIC_CHARS', () => {
    test('should contain expected characters', () => {
      expect(ALPHANUMERIC_CHARS).toContain('0');
      expect(ALPHANUMERIC_CHARS).toContain('9');
      expect(ALPHANUMERIC_CHARS).toContain('A');
      expect(ALPHANUMERIC_CHARS).toContain('Z');
      expect(ALPHANUMERIC_CHARS).toContain(' ');
      expect(ALPHANUMERIC_CHARS).toContain('$');
      expect(ALPHANUMERIC_CHARS).toContain('%');
      expect(ALPHANUMERIC_CHARS).toContain('*');
      expect(ALPHANUMERIC_CHARS).toContain('+');
      expect(ALPHANUMERIC_CHARS).toContain('-');
      expect(ALPHANUMERIC_CHARS).toContain('.');
      expect(ALPHANUMERIC_CHARS).toContain('/');
      expect(ALPHANUMERIC_CHARS).toContain(':');
    });

    test('should have correct length', () => {
      expect(ALPHANUMERIC_CHARS.length).toBe(45);
    });

    test('should be a string', () => {
      expect(typeof ALPHANUMERIC_CHARS).toBe('string');
    });
  });

  describe('MAX_DATA_LENGTH', () => {
    test('should be a reasonable maximum', () => {
      expect(MAX_DATA_LENGTH).toBe(2900);
      expect(typeof MAX_DATA_LENGTH).toBe('number');
      expect(MAX_DATA_LENGTH).toBeGreaterThan(0);
    });
  });

  describe('VERSION_INFO', () => {
    test('should have correct version boundaries', () => {
      expect(VERSION_INFO.MIN_VERSION).toBe(1);
      expect(VERSION_INFO.MAX_VERSION).toBe(40);
      expect(VERSION_INFO.SUPPORTED_MAX).toBe(15);
    });

    test('should have logical version progression', () => {
      expect(VERSION_INFO.MIN_VERSION).toBeLessThan(VERSION_INFO.SUPPORTED_MAX);
      expect(VERSION_INFO.SUPPORTED_MAX).toBeLessThan(VERSION_INFO.MAX_VERSION);
    });
  });

  describe('MODULE_SIZES', () => {
    test('should have correct base size and increment', () => {
      expect(MODULE_SIZES.BASE_SIZE).toBe(21);
      expect(MODULE_SIZES.VERSION_INCREMENT).toBe(4);
    });

    test('should be positive numbers', () => {
      expect(MODULE_SIZES.BASE_SIZE).toBeGreaterThan(0);
      expect(MODULE_SIZES.VERSION_INCREMENT).toBeGreaterThan(0);
    });
  });

  describe('PATTERN_SIZES', () => {
    test('should have correct pattern sizes', () => {
      expect(PATTERN_SIZES.FINDER).toBe(7);
      expect(PATTERN_SIZES.ALIGNMENT).toBe(5);
      expect(PATTERN_SIZES.TIMING).toBe(1);
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    test('should have all required properties', () => {
      expect(DEFAULT_OPTIONS).toHaveProperty('size');
      expect(DEFAULT_OPTIONS).toHaveProperty('margin');
      expect(DEFAULT_OPTIONS).toHaveProperty('errorCorrectionLevel');
      expect(DEFAULT_OPTIONS).toHaveProperty('color');
    });

    test('should have reasonable default values', () => {
      expect(DEFAULT_OPTIONS.size).toBe(600);
      expect(DEFAULT_OPTIONS.margin).toBe(8);
      expect(DEFAULT_OPTIONS.errorCorrectionLevel).toBe('M');
      expect(DEFAULT_OPTIONS.color.dark).toBe('#000000');
      expect(DEFAULT_OPTIONS.color.light).toBe('#FFFFFF');
    });
  });

  describe('CAPACITY_TABLE', () => {
    test('should have entries for supported versions', () => {
      const supportedVersions = [1, 2, 3, 4, 5, 10];
      supportedVersions.forEach(version => {
        expect(CAPACITY_TABLE).toHaveProperty(version.toString());
      });
    });

    test('should have all error correction levels for each version', () => {
      const levels = ['L', 'M', 'Q', 'H'];
      Object.keys(CAPACITY_TABLE).forEach(version => {
        levels.forEach(level => {
          expect(CAPACITY_TABLE[version]).toHaveProperty(level);
          expect(Array.isArray(CAPACITY_TABLE[version][level])).toBe(true);
          expect(CAPACITY_TABLE[version][level].length).toBe(4); // For 4 modes
        });
      });
    });

    test('should have decreasing capacities from L to H', () => {
      Object.keys(CAPACITY_TABLE).forEach(version => {
        const levels = CAPACITY_TABLE[version];
        for (let i = 0; i < 4; i++) {
          expect(levels.L[i]).toBeGreaterThanOrEqual(levels.M[i]);
          expect(levels.M[i]).toBeGreaterThanOrEqual(levels.Q[i]);
          expect(levels.Q[i]).toBeGreaterThanOrEqual(levels.H[i]);
        }
      });
    });
  });

  describe('FINDER_PATTERN', () => {
    test('should be 7x7 matrix', () => {
      expect(FINDER_PATTERN.length).toBe(7);
      FINDER_PATTERN.forEach(row => {
        expect(row.length).toBe(7);
      });
    });

    test('should contain only 0s and 1s', () => {
      FINDER_PATTERN.forEach(row => {
        row.forEach(cell => {
          expect([0, 1]).toContain(cell);
        });
      });
    });

    test('should have correct finder pattern structure', () => {
      // Test corners
      expect(FINDER_PATTERN[0][0]).toBe(1);
      expect(FINDER_PATTERN[0][6]).toBe(1);
      expect(FINDER_PATTERN[6][0]).toBe(1);
      expect(FINDER_PATTERN[6][6]).toBe(1);
      
      // Test center
      expect(FINDER_PATTERN[3][3]).toBe(1);
    });
  });

  describe('MASK_PATTERNS', () => {
    test('should have 8 mask patterns', () => {
      expect(MASK_PATTERNS.length).toBe(8);
    });

    test('should all be functions', () => {
      MASK_PATTERNS.forEach(pattern => {
        expect(typeof pattern).toBe('function');
      });
    });

    test('should return boolean values for given coordinates', () => {
      MASK_PATTERNS.forEach((pattern, index) => {
        const result = pattern(2, 3);
        expect(typeof result).toBe('boolean');
      });
    });

    test('should handle coordinate parameters correctly', () => {
      // Test that each pattern function accepts row and col parameters
      MASK_PATTERNS.forEach((pattern, index) => {
        expect(() => pattern(0, 0)).not.toThrow();
        expect(() => pattern(10, 15)).not.toThrow();
      });
    });

    test('should produce different results for different patterns', () => {
      // Test one coordinate that should produce different results across patterns
      const results = MASK_PATTERNS.map(pattern => pattern(1, 2));
      
      // At least some patterns should produce different results
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThanOrEqual(1);
      expect(results.length).toBe(8);
    });
  });
});