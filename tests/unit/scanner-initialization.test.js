import { QRCodeScanner } from '../../src/scanner.js';
import { MockFactory } from '../helpers/mock-factory.js';

describe('QRCodeScanner - Initialization', () => {
  describe('constructor with default options', () => {
    let scanner;
    
    beforeEach(() => {
      scanner = new QRCodeScanner();
    });

    test('should initialize with default values', () => {
      expect(scanner.video).toBeUndefined();
      expect(scanner.canvas).toBeDefined();
      expect(scanner.continuous).toBe(true);
      expect(scanner.stream).toBeNull();
      expect(scanner.scanning).toBe(false);
      expect(scanner.decoder).toBeDefined();
      expect(scanner.animationId).toBeNull();
    });

    test('should initialize listeners map', () => {
      expect(scanner.listeners).toBeInstanceOf(Map);
      expect(scanner.listeners.size).toBe(0);
    });

    test('should detect test environment correctly', () => {
      // In JSDOM test environment, document exists but navigator might not
      const expectedTestEnv = typeof navigator === 'undefined' || typeof document === 'undefined';
      expect(scanner.isTestEnvironment).toBe(expectedTestEnv);
    });
  });

  describe('constructor with custom options', () => {
    test('should accept custom video element', () => {
      const mockVideo = MockFactory.createVideoElement();
      const scanner = new QRCodeScanner({ video: mockVideo });
      
      expect(scanner.video).toBe(mockVideo);
    });

    test('should accept custom canvas element', () => {
      const { canvas } = MockFactory.createCanvasElement();
      const scanner = new QRCodeScanner({ canvas });
      
      expect(scanner.canvas).toBe(canvas);
    });

    test('should accept continuous option', () => {
      const scanner = new QRCodeScanner({ continuous: false });
      
      expect(scanner.continuous).toBe(false);
    });

    test('should accept multiple options', () => {
      const mockVideo = MockFactory.createVideoElement();
      const { canvas } = MockFactory.createCanvasElement();
      
      const scanner = new QRCodeScanner({
        video: mockVideo,
        canvas,
        continuous: false
      });
      
      expect(scanner.video).toBe(mockVideo);
      expect(scanner.canvas).toBe(canvas);
      expect(scanner.continuous).toBe(false);
    });
  });
});