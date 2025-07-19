import { QRCodeScanner } from '../../src/scanner.js';
import { MockFactory } from '../helpers/mock-factory.js';
import { ErrorAssertions } from '../helpers/svg-assertions.js';

describe('QRCodeScanner - Lifecycle', () => {
  let scanner;
  
  beforeEach(() => {
    scanner = new QRCodeScanner();
  });

  describe('start', () => {
    test('should throw error in test environment', async () => {
      await ErrorAssertions.throwsAsync(
        scanner.start(),
        Error,
        'Camera not available in this environment'
      );
    });

    test('should handle FEATURE_NOT_AVAILABLE error', async () => {
      try {
        await scanner.start();
      } catch (error) {
        expect(error.name).toBe('CameraAccessError');
        expect(error.code).toBe('FEATURE_NOT_AVAILABLE');
      }
    });
  });

  describe('stop', () => {
    test('should set scanning to false', () => {
      scanner.scanning = true;
      scanner.stop();
      
      expect(scanner.scanning).toBe(false);
    });

    test('should stop media stream tracks', () => {
      const mockTrack = MockFactory.createStreamTrack();
      const mockStream = MockFactory.createMediaStream([mockTrack]);
      scanner.stream = mockStream;
      
      scanner.stop();
      
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(scanner.stream).toBeNull();
    });

    test('should handle multiple tracks', () => {
      const track1 = MockFactory.createStreamTrack();
      const track2 = MockFactory.createStreamTrack();
      const mockStream = MockFactory.createMediaStream([track1, track2]);
      scanner.stream = mockStream;
      
      scanner.stop();
      
      expect(track1.stop).toHaveBeenCalled();
      expect(track2.stop).toHaveBeenCalled();
    });

    test('should handle null stream gracefully', () => {
      scanner.stream = null;
      
      expect(() => scanner.stop()).not.toThrow();
      expect(scanner.scanning).toBe(false);
    });

    test('should cancel animation frame', () => {
      const mockAnimationId = 123;
      scanner.animationId = mockAnimationId;
      
      // Mock cancelAnimationFrame
      global.cancelAnimationFrame = jest.fn();
      
      scanner.stop();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(mockAnimationId);
      expect(scanner.animationId).toBeNull();
      
      delete global.cancelAnimationFrame;
    });

    test('should reset video srcObject', () => {
      const mockVideo = MockFactory.createVideoElement();
      scanner.video = mockVideo;
      scanner.video.srcObject = 'mock-stream';
      
      scanner.stop();
      
      expect(scanner.video.srcObject).toBeNull();
    });
  });

  describe('scan', () => {
    test('should throw error without video element', async () => {
      scanner.video = null;
      
      await ErrorAssertions.throwsAsync(
        scanner.scan(),
        Error,
        'Video or canvas not available'
      );
    });

    test('should throw error without canvas element', async () => {
      scanner.video = MockFactory.createVideoElement();
      scanner.canvas = null;
      
      await ErrorAssertions.throwsAsync(
        scanner.scan(),
        Error,
        'Video or canvas not available'
      );
    });
  });

  describe('scanImage', () => {
    test('should throw error without canvas', async () => {
      scanner.canvas = null;
      const mockImage = MockFactory.createImageElement();
      
      await ErrorAssertions.throwsAsync(
        scanner.scanImage(mockImage),
        Error,
        'Canvas not available'
      );
    });

    test('should throw error for unsupported image type', async () => {
      const invalidImage = { width: 100, height: 100 }; // Missing required properties
      
      await ErrorAssertions.throwsAsync(
        scanner.scanImage(invalidImage),
        Error,
        'Unsupported image type'
      );
    });
  });
});