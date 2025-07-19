import { QRCodeDecoder } from '../../src/decoder.js';
import { ImageDataFactory } from '../helpers/image-factory.js';

describe('QRCodeDecoder - Integration', () => {
  let decoder;
  
  beforeEach(() => {
    decoder = new QRCodeDecoder();
  });

  describe('initialization', () => {
    test('should initialize with finder patterns', () => {
      expect(decoder.patterns.FINDER).toBeDefined();
      expect(decoder.patterns.FINDER.length).toBe(7);
      expect(decoder.patterns.FINDER[0].length).toBe(7);
    });

    test('should initialize with mode mappings', () => {
      expect(decoder.modes).toEqual({
        1: 'NUMERIC',
        2: 'ALPHANUMERIC',
        4: 'BYTE',
        8: 'KANJI'
      });
    });
  });

  describe('matrix extraction', () => {
    test('should extract binary matrix from ImageData', () => {
      const imageData = ImageDataFactory.createBinary(2, 2);
      const matrix = decoder.extractMatrix(imageData);
      
      expect(matrix.length).toBe(2);
      expect(matrix[0].length).toBe(2);
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.every(row => row.every(cell => typeof cell === 'number'))).toBe(true);
    });

    test('should handle different image sizes', () => {
      const sizes = [[5, 5], [10, 15], [21, 21]];
      
      sizes.forEach(([width, height]) => {
        const imageData = ImageDataFactory.create(width, height);
        const matrix = decoder.extractMatrix(imageData);
        
        expect(matrix.length).toBe(height);
        expect(matrix[0].length).toBe(width);
      });
    });
  });

  describe('decode integration', () => {
    test('should return null for invalid QR code', async () => {
      const imageData = ImageDataFactory.create(100, 100);
      const result = await decoder.decode(imageData);
      
      expect(result).toBeNull();
    });

    test('should handle preprocessing errors gracefully', async () => {
      const result = await decoder.decode('invalid-data');
      expect(result).toBeNull();
    });
  });

  describe('matrix decoding', () => {
    test('should return null for empty matrix', () => {
      const matrix = [];
      const result = decoder.decodeMatrix(matrix);
      
      expect(result).toBeNull();
    });

    test('should return null for insufficient finder patterns', () => {
      const matrix = Array(10).fill().map(() => Array(10).fill(0));
      const result = decoder.decodeMatrix(matrix);
      
      expect(result).toBeNull();
    });
  });

  describe('format info reading', () => {
    test('should return default format info for standard matrix', () => {
      const matrix = Array(21).fill().map(() => Array(21).fill(0));
      const formatInfo = decoder.readFormatInfo(matrix);
      
      expect(formatInfo).toEqual({
        errorCorrectionLevel: 'M',
        maskPattern: 0
      });
    });
  });

  describe('data reading', () => {
    test('should handle minimal matrix gracefully', () => {
      const matrix = [[1, 0], [0, 1]];
      const formatInfo = { errorCorrectionLevel: 'M', maskPattern: 0 };
      const data = decoder.readData(matrix, formatInfo);
      
      expect(typeof data).toBe('string');
    });
  });
});