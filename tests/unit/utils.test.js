import { 
  calculateDistance,
  isValidFinderPattern
} from '../../src/utils.js';
import { 
  base64ToUint8Array,
  uint8ArrayToBase64
} from '../../src/base64-utils.js';
import { 
  uint8ArrayToImageData,
  grayscaleToImageData,
  bilinearInterpolation,
  threshold,
  adaptiveThreshold
} from '../../src/image-utils.js';
// KISS準拠：シンプルな環境セットアップ
describe('Utils', () => {
  beforeAll(() => {
    // Mock browser environment once for all tests
    global.ImageData = global.ImageData || class ImageData {
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
    global.btoa = global.btoa || ((str) => Buffer.from(str).toString('base64'));
    global.atob = global.atob || ((str) => Buffer.from(str, 'base64').toString());
  });

  describe('base64ToUint8Array', () => {
    test('should convert base64 string to Uint8Array', () => {
      const base64 = btoa('hello');
      const result = base64ToUint8Array(base64);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
    });

    test('should handle data URL format', () => {
      const base64 = `data:image/png;base64,${btoa('test')}`;
      const result = base64ToUint8Array(base64);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
    });
  });

  describe('uint8ArrayToBase64', () => {
    test('should convert Uint8Array to base64', () => {
      const array = new Uint8Array([104, 101, 108, 108, 111]);
      const result = uint8ArrayToBase64(array);
      
      expect(typeof result).toBe('string');
      expect(atob(result)).toBe('hello');
    });

    test('should handle empty array', () => {
      const array = new Uint8Array([]);
      const result = uint8ArrayToBase64(array);
      
      expect(result).toBe('');
    });
  });

  describe('uint8ArrayToImageData', () => {
    test('should convert Uint8Array to ImageData', () => {
      const array = new Uint8Array(16); // 2x2 RGBA
      array.fill(255);
      
      const result = uint8ArrayToImageData(array, 2, 2);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    test('should throw error for invalid dimensions', () => {
      const array = new Uint8Array(8);
      
      expect(() => uint8ArrayToImageData(array, 2, 2))
        .toThrow('Invalid array length for given dimensions');
    });
  });

  describe('grayscaleToImageData', () => {
    test('should convert grayscale array to ImageData', () => {
      const grayscale = [128, 64, 192, 255];
      
      const result = grayscaleToImageData(grayscale, 2, 2);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.data[0]).toBe(128); // R
      expect(result.data[1]).toBe(128); // G
      expect(result.data[2]).toBe(128); // B
      expect(result.data[3]).toBe(255); // A
    });
  });

  describe('calculateDistance', () => {
    test('should calculate distance between two points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      
      const result = calculateDistance(point1, point2);
      
      expect(result).toBe(5);
    });

    test('should handle same points', () => {
      const point = { x: 5, y: 5 };
      
      const result = calculateDistance(point, point);
      
      expect(result).toBe(0);
    });
  });

  describe('isValidFinderPattern', () => {
    test('should validate correct finder pattern', () => {
      const pattern = [1, 1, 1, 1, 1, 1, 1];
      
      const result = isValidFinderPattern(pattern);
      
      expect(result).toBe(true);
    });

    test('should reject invalid pattern length', () => {
      const pattern = [1, 1, 1];
      
      const result = isValidFinderPattern(pattern);
      
      expect(result).toBe(false);
    });

    test('should reject null pattern', () => {
      const result = isValidFinderPattern(null);
      
      expect(result).toBe(false);
    });

    test('should reject incorrect pattern values', () => {
      const pattern = [1, 1, 1, 0, 1, 1, 1];
      
      const result = isValidFinderPattern(pattern);
      
      expect(result).toBe(false);
    });
  });

  describe('bilinearInterpolation', () => {
    const testMatrix = [
      [0, 50, 100],
      [25, 75, 125],
      [50, 100, 150]
    ];

    test('should interpolate within bounds', () => {
      const result = bilinearInterpolation(testMatrix, 1.5, 1.5);
      
      expect(result).toBeCloseTo(112.5, 1);
    });

    test('should return 0 for out of bounds coordinates', () => {
      const result = bilinearInterpolation(testMatrix, -1, -1);
      
      expect(result).toBe(0);
    });

    test('should handle integer coordinates', () => {
      const result = bilinearInterpolation(testMatrix, 1, 1);
      
      expect(result).toBe(75);
    });
  });

  describe('threshold', () => {
    test('should apply threshold to ImageData', () => {
      const imageData = {
        data: new Uint8ClampedArray([
          100, 100, 100, 255, // gray pixel < 128
          200, 200, 200, 255  // gray pixel > 128
        ]),
        width: 2,
        height: 1
      };
      
      const result = threshold(imageData, 128);
      
      expect(result).toEqual([[1, 0]]);
    });

    test('should use default threshold value', () => {
      const imageData = {
        data: new Uint8ClampedArray([100, 100, 100, 255]),
        width: 1,
        height: 1
      };
      
      const result = threshold(imageData);
      
      expect(result).toEqual([[1]]);
    });
  });

  describe('adaptiveThreshold', () => {
    test('should apply adaptive threshold', () => {
      const imageData = {
        data: new Uint8ClampedArray([
          100, 100, 100, 255, // pixel 1
          150, 150, 150, 255, // pixel 2
          120, 120, 120, 255, // pixel 3
          180, 180, 180, 255  // pixel 4
        ]),
        width: 2,
        height: 2
      };
      
      const result = adaptiveThreshold(imageData, 3, 2);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2);
    });

    test('should use default parameters', () => {
      const imageData = {
        data: new Uint8ClampedArray([100, 100, 100, 255]),
        width: 1,
        height: 1
      };
      
      const result = adaptiveThreshold(imageData);
      
      expect(result).toEqual([[0]]);
    });
  });
});