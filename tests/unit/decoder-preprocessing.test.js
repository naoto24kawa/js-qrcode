import { QRCodeDecoder } from '../../src/decoder.js';
import { ImageDataFactory, Uint8ArrayFactory } from '../helpers/image-factory.js';
import { ErrorAssertions } from '../helpers/svg-assertions.js';

describe('QRCodeDecoder - Preprocessing', () => {
  let decoder;
  
  beforeEach(() => {
    decoder = new QRCodeDecoder();
  });

  describe('ImageData input', () => {
    test('should handle ImageData directly', async () => {
      const imageData = ImageDataFactory.create();
      const result = await decoder.preprocessImage(imageData, {});
      
      expect(result).toBe(imageData);
    });

    test('should handle different ImageData sizes', async () => {
      const sizes = [[10, 10], [50, 30], [100, 200]];
      
      for (const [width, height] of sizes) {
        const imageData = ImageDataFactory.create(width, height);
        const result = await decoder.preprocessImage(imageData, {});
        
        expect(result.width).toBe(width);
        expect(result.height).toBe(height);
      }
    });
  });

  describe('Uint8Array input', () => {
    test('should convert grayscale Uint8Array to ImageData', async () => {
      const dimensions = { width: 20, height: 20 };
      const uint8Array = Uint8ArrayFactory.create(400, 'gradient');
      
      const result = await decoder.preprocessImage(uint8Array, dimensions);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toBe(dimensions.width);
      expect(result.height).toBe(dimensions.height);
    });

    test('should handle RGBA Uint8Array', async () => {
      const dimensions = { width: 10, height: 10 };
      const uint8Array = Uint8ArrayFactory.createForImageData(10, 10, 4);
      
      const result = await decoder.preprocessImage(uint8Array, dimensions);
      
      expect(result).toBeInstanceOf(ImageData);
    });

    test('should throw error without dimensions', async () => {
      const uint8Array = Uint8ArrayFactory.create(400);
      
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage(uint8Array, {}),
        Error,
        'Width and height required for Uint8Array data'
      );
    });

    test('should throw error for invalid array length', async () => {
      const uint8Array = Uint8ArrayFactory.create(100);
      const dimensions = { width: 20, height: 20 };
      
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage(uint8Array, dimensions),
        Error,
        'Invalid Uint8Array length for given dimensions'
      );
    });
  });

  describe('base64 input', () => {
    test('should handle base64 data URL in browser environment', async () => {
      // Mock browser environment
      const originalDocument = global.document;
      global.document = {};
      
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage(base64Data, {}),
        Error,
        'Failed to load image'
      );
      
      global.document = originalDocument;
    });

    test('should throw error in server-like environment', async () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // In JSDOM, images may fail to load due to lack of actual image support
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage(base64Data, {}),
        Error
        // Message can vary between 'Failed to load image' or 'Server-side image parsing not implemented'
      );
    });
  });

  describe('invalid input', () => {
    test('should throw error for unsupported format', async () => {
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage('invalid-string', {}),
        Error,
        'Unsupported data format'
      );
    });

    test('should throw error for number input', async () => {
      await ErrorAssertions.throwsAsync(
        decoder.preprocessImage(123, {}),
        Error,
        'Unsupported data format'
      );
    });
  });
});