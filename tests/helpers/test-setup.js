// 共通テストセットアップのファクトリー

export class TestEnvironmentSetup {
  static mockBrowserEnvironment() {
    const originalDocument = global.document;
    const originalNavigator = global.navigator;
    
    global.document = {
      createElement: jest.fn().mockReturnValue({
        width: 640,
        height: 480,
        getContext: jest.fn().mockReturnValue({
          drawImage: jest.fn(),
          getImageData: jest.fn(),
          putImageData: jest.fn()
        })
      })
    };
    
    global.navigator = {
      mediaDevices: {
        getUserMedia: jest.fn()
      }
    };

    return () => {
      global.document = originalDocument;
      global.navigator = originalNavigator;
    };
  }

  static mockServerEnvironment() {
    const originalDocument = global.document;
    const originalNavigator = global.navigator;
    
    global.document = undefined;
    global.navigator = undefined;

    return () => {
      global.document = originalDocument;
      global.navigator = originalNavigator;
    };
  }

  static mockAnimationFrame() {
    const originalRAF = global.requestAnimationFrame;
    const originalCAF = global.cancelAnimationFrame;
    
    global.requestAnimationFrame = jest.fn((callback) => {
      callback();
      return 123;
    });
    
    global.cancelAnimationFrame = jest.fn();

    return () => {
      global.requestAnimationFrame = originalRAF;
      global.cancelAnimationFrame = originalCAF;
    };
  }
}

// DIP準拠：抽象インターフェースを通じたインスタンス作成
export class InstanceSetup {
  static createEncoderWithMocks() {
    const { TestInstanceFactory } = require('./test-interfaces.js');
    return TestInstanceFactory.createEncoder();
  }

  static createGeneratorWithMocks() {
    const { TestInstanceFactory } = require('./test-interfaces.js');
    return TestInstanceFactory.createGenerator();
  }

  static createDecoderWithMocks() {
    const { TestInstanceFactory } = require('./test-interfaces.js');
    return TestInstanceFactory.createDecoder();
  }

  static createScannerWithMocks(options = {}) {
    const { TestInstanceFactory } = require('./test-interfaces.js');
    return TestInstanceFactory.createScanner(options);
  }
}

// ISP準拠：専門特化したアサーションクラス群
export class QRResultAssertions {
  static isValid(result, expectedData) {
    expect(result).toEqual(
      expect.objectContaining({
        data: expectedData,
        mode: expect.any(Number),
        version: expect.any(Number),
        errorCorrectionLevel: expect.any(String),
        modules: expect.any(Array),
        size: expect.any(Number)
      })
    );
  }
}

export class SVGValidationAssertions {
  static isValid(svg) {
    expect(svg).toMatch(/^<svg[^>]*>/);
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('<rect');
  }
}

export class MatrixAssertions {
  static hasValidDimensions(matrix, expectedRows, expectedCols) {
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBe(expectedRows);
    matrix.forEach(row => {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(expectedCols);
    });
  }
}

export class TypeAssertions {
  static isFunction(value) {
    expect(typeof value).toBe('function');
  }

  static isConstructor(Constructor) {
    expect(typeof Constructor).toBe('function');
    expect(() => new Constructor()).not.toThrow();
  }
}

// 後方互換性のためのレガシーヘルパー
export class ExpectationHelpers {
  static expectValidQRResult = QRResultAssertions.isValid;
  static expectValidSVG = SVGValidationAssertions.isValid;
  static expectArrayOfArrays = MatrixAssertions.hasValidDimensions;
  static expectFunction = TypeAssertions.isFunction;
  static expectConstructor = TypeAssertions.isConstructor;
}

// KISS準拠：シンプルなテストパターン
export class ErrorTestPatterns {
  static async expectAsyncError(asyncTestFn, ErrorClass, expectedMessage = null) {
    await expect(asyncTestFn()).rejects.toThrow(ErrorClass);
    if (expectedMessage) {
      await expect(asyncTestFn()).rejects.toThrow(expectedMessage);
    }
  }

  static expectSyncError(testFn, ErrorClass, expectedMessage = null) {
    expect(testFn).toThrow(ErrorClass);
    if (expectedMessage) {
      expect(testFn).toThrow(expectedMessage);
    }
  }
}

// レガシー関数の維持
export const testErrorHandling = ErrorTestPatterns.expectSyncError;
export const testAsyncErrorHandling = ErrorTestPatterns.expectAsyncError;

// 共通テストデータの生成
export function generateTestMatrix(rows, cols, fillValue = 0) {
  return Array(rows).fill().map(() => Array(cols).fill(fillValue));
}

export function generateBinaryMatrix(rows, cols) {
  return Array(rows).fill().map(() => 
    Array(cols).fill().map(() => Math.random() > 0.5 ? 1 : 0)
  );
}