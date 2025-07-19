// Builder PatternでOCP原則に準拠したテストデータ生成

export class QRTestDataBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._data = 'DEFAULT_TEST_DATA';
    this._mode = 'BYTE';
    this._errorCorrectionLevel = 'M';
    this._options = {};
    return this;
  }

  withData(data) {
    this._data = data;
    return this;
  }

  withMode(mode) {
    this._mode = mode;
    return this;
  }

  withErrorCorrection(level) {
    this._errorCorrectionLevel = level;
    return this;
  }

  withOptions(options) {
    this._options = { ...this._options, ...options };
    return this;
  }

  build() {
    return {
      data: this._data,
      mode: this._mode,
      errorCorrectionLevel: this._errorCorrectionLevel,
      options: this._options
    };
  }

  // Preset methods for common test scenarios
  static numeric(data = '12345') {
    return new QRTestDataBuilder()
      .withData(data)
      .withMode('NUMERIC');
  }

  static alphanumeric(data = 'HELLO WORLD') {
    return new QRTestDataBuilder()
      .withData(data)
      .withMode('ALPHANUMERIC');
  }

  static byte(data = 'hello world') {
    return new QRTestDataBuilder()
      .withData(data)
      .withMode('BYTE');
  }

  static withLongData(length = 3000) {
    return new QRTestDataBuilder()
      .withData('A'.repeat(length));
  }
}

export class SVGOptionsBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._size = 200;
    this._margin = 4;
    this._errorCorrectionLevel = 'M';
    this._color = { dark: '#000000', light: '#FFFFFF' };
    return this;
  }

  withSize(size) {
    this._size = size;
    return this;
  }

  withMargin(margin) {
    this._margin = margin;
    return this;
  }

  withErrorCorrection(level) {
    this._errorCorrectionLevel = level;
    return this;
  }

  withColors(dark, light) {
    this._color = { dark, light };
    return this;
  }

  build() {
    return {
      size: this._size,
      margin: this._margin,
      errorCorrectionLevel: this._errorCorrectionLevel,
      color: this._color
    };
  }

  // Preset methods
  static small() {
    return new SVGOptionsBuilder().withSize(100);
  }

  static large() {
    return new SVGOptionsBuilder().withSize(500);
  }

  static highError() {
    return new SVGOptionsBuilder().withErrorCorrection('H');
  }

  static custom(size, margin, colors) {
    return new SVGOptionsBuilder()
      .withSize(size)
      .withMargin(margin)
      .withColors(colors.dark, colors.light);
  }
}

export class TestDataGenerator {
  static generateModeTestCases() {
    return [
      { input: '12345', expected: 'NUMERIC', description: 'numeric only' },
      { input: 'HELLO123', expected: 'ALPHANUMERIC', description: 'alphanumeric' },
      { input: 'hello@world', expected: 'BYTE', description: 'byte with special chars' },
      { input: 'こんにちは', expected: 'BYTE', description: 'unicode characters' }
    ];
  }

  static generateVersionTestCases() {
    return [
      { data: 'A'.repeat(5), level: 'L', expectedMin: 1 },
      { data: 'A'.repeat(20), level: 'M', expectedMin: 1 },
      { data: 'A'.repeat(50), level: 'H', expectedMin: 2 }
    ];
  }

  static generateErrorCorrectionLevels() {
    return ['L', 'M', 'Q', 'H'];
  }

  static generateInvalidInputs() {
    return [null, undefined, '', 123, {}, [], true, false];
  }
}