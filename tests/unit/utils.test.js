import { 
  calculateDistance
} from '../../src/utils.js';
import { 
  base64ToUint8Array,
  uint8ArrayToBase64
} from '../../src/base64-utils.js';
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


});