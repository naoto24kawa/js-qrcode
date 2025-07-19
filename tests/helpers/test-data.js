export const TEST_DATA = {
  NUMERIC: {
    SHORT: '123',
    MEDIUM: '12345',
    LONG: '123456789'
  },
  ALPHANUMERIC: {
    SHORT: 'HELLO',
    MEDIUM: 'HELLO WORLD',
    LONG: 'HELLO123'
  },
  BYTE: {
    SHORT: 'hello',
    MEDIUM: 'hello world',
    LONG: 'Hello@World'
  },
  JAPANESE: 'こんにちは',
  LONG_TEXT: 'A'.repeat(3000)
};

export const EXPECTED_MODES = {
  NUMERIC: 1,
  ALPHANUMERIC: 2,
  BYTE: 4,
  KANJI: 8
};

export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'];

export const DEFAULT_OPTIONS = {
  size: 200,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#ffffff' }
};

export const CUSTOM_OPTIONS = {
  size: 300,
  margin: 8,
  errorCorrectionLevel: 'H',
  color: { dark: '#ff0000', light: '#00ff00' }
};