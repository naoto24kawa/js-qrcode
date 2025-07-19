import { 
  QRCode, 
  QRCodeGenerationError, 
  QRCodeDecodeError, 
  CameraAccessError, 
  EnvironmentError 
} from '../../src/index.js';
import { TEST_DATA } from '../helpers/test-data.js';
import { QRTestDataBuilder, TestDataGenerator } from '../helpers/test-builders.js';
import { SVGStructureAssertions, AsyncErrorAssertions, SyncErrorAssertions, ErrorAssertions } from '../helpers/svg-assertions.js';
import { ImageDataFactory, Uint8ArrayFactory } from '../helpers/image-factory.js';
import { SVGValidationAssertions, ErrorTestPatterns } from '../helpers/test-setup.js';

describe('QRCode Main API - Integration', () => {
  describe('QRCode.generate', () => {
    describe('successful generation', () => {
      // KISS準拠：個別テストで複雑なループを回避
      test('should generate valid SVG for numeric data', () => {
        const svg = QRCode.generate('12345');
        SVGValidationAssertions.isValid(svg);
      });

      test('should generate valid SVG for alphanumeric data', () => {
        const svg = QRCode.generate('HELLO WORLD');
        SVGValidationAssertions.isValid(svg);
      });

      test('should generate valid SVG for byte data', () => {
        const svg = QRCode.generate('hello world');
        SVGValidationAssertions.isValid(svg);
      });

      test('should handle custom options properly', () => {
        const testData = QRTestDataBuilder.alphanumeric('HELLO').build();
        const customOptions = {
          size: 300,
          margin: 8,
          color: { dark: '#ff0000', light: '#00ff00' }
        };
        
        const svg = QRCode.generate(testData.data, customOptions);
        
        SVGStructureAssertions.hasDimensions(svg, 300, 300);
        expect(svg).toContain('#ff0000');
        expect(svg).toContain('#00ff00');
      });
    });

    describe('input validation', () => {
      test.each(TestDataGenerator.generateInvalidInputs())(
        'should reject invalid input: %s',
        (invalidInput) => {
          SyncErrorAssertions.throws(
            () => QRCode.generate(invalidInput),
            QRCodeGenerationError,
            'Invalid data provided'
          );
        }
      );

      test('should reject oversized data', () => {
        const oversizedData = QRTestDataBuilder.withLongData(3000).build();
        
        SyncErrorAssertions.throws(
          () => QRCode.generate(oversizedData.data),
          QRCodeGenerationError,
          'Data too long for QR code'
        );
      });
    });

    describe('error specificity', () => {
      test('should provide detailed error information', () => {
        try {
          QRCode.generate(null);
        } catch (error) {
          SyncErrorAssertions.hasProperties(
            error,
            'QRCodeGenerationError',
            'Invalid data provided',
            'INVALID_DATA'
          );
        }
      });
    });
  });

  describe('QRCode.decode', () => {
    describe('input validation', () => {
      test.each([null, undefined])('should throw error for %s input', async (input) => {
        await AsyncErrorAssertions.throwsAsync(
          QRCode.decode(input),
          QRCodeDecodeError,
          'No data provided'
        );
      });
    });

    describe('supported input types', () => {
      test('should accept ImageData input', async () => {
        const imageData = ImageDataFactory.create();
        
        await AsyncErrorAssertions.throwsAsync(
          QRCode.decode(imageData),
          QRCodeDecodeError,
          'Failed to decode QR code'
        );
      });

      test('should accept Uint8Array with dimensions', async () => {
        const uint8Array = Uint8ArrayFactory.create(400);
        const options = { width: 20, height: 20 };
        
        await AsyncErrorAssertions.throwsAsync(
          QRCode.decode(uint8Array, options),
          QRCodeDecodeError,
          'Failed to decode QR code'
        );
      });
    });

    describe('error handling', () => {
      test('should preserve specific error types', async () => {
        try {
          await QRCode.decode(null);
        } catch (error) {
          expect(error).toBeInstanceOf(QRCodeDecodeError);
          expect(error.code).toBe('INVALID_DATA');
        }
      });
    });
  });

  describe('QRCode.Scanner', () => {
    test('should be accessible as constructor', () => {
      expect(QRCode.Scanner).toBeDefined();
      expect(typeof QRCode.Scanner).toBe('function');
    });

    test('should throw appropriate error in test environment', async () => {
      const scanner = new QRCode.Scanner();
      await expect(scanner.start()).rejects.toThrow('Camera not available in this environment');
    });
  });

  describe('Error Classes Accessibility', () => {
    const errorMappings = [
      ['QRCodeGenerationError', QRCodeGenerationError],
      ['QRCodeDecodeError', QRCodeDecodeError],
      ['CameraAccessError', CameraAccessError],
      ['EnvironmentError', EnvironmentError]
    ];

    test.each(errorMappings)('%s should be accessible', (name, ErrorClass) => {
      expect(QRCode.errors[name]).toBe(ErrorClass);
    });

    test('should create errors with proper structure', () => {
      const error = new QRCodeGenerationError('Test message', 'TEST_CODE');
      
      SyncErrorAssertions.hasProperties(
        error,
        'QRCodeGenerationError',
        'Test message',
        'TEST_CODE'
      );
    });
  });
});