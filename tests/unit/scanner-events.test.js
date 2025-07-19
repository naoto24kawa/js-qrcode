import { QRCodeScanner } from '../../src/scanner.js';
import { MockFactory } from '../helpers/mock-factory.js';

describe('QRCodeScanner - Event Handling', () => {
  let scanner;
  
  beforeEach(() => {
    scanner = new QRCodeScanner();
  });

  describe('addEventListener', () => {
    test('should add single event listener', () => {
      const listener = MockFactory.createEventListener();
      scanner.addEventListener('test', listener);
      
      expect(scanner.listeners.has('test')).toBe(true);
      expect(scanner.listeners.get('test')).toContain(listener);
    });

    test('should add multiple listeners for same event', () => {
      const listener1 = MockFactory.createEventListener();
      const listener2 = MockFactory.createEventListener();
      
      scanner.addEventListener('test', listener1);
      scanner.addEventListener('test', listener2);
      
      const listeners = scanner.listeners.get('test');
      expect(listeners).toContain(listener1);
      expect(listeners).toContain(listener2);
      expect(listeners.length).toBe(2);
    });

    test('should add listeners for different events', () => {
      const listener1 = MockFactory.createEventListener();
      const listener2 = MockFactory.createEventListener();
      
      scanner.addEventListener('decode', listener1);
      scanner.addEventListener('error', listener2);
      
      expect(scanner.listeners.has('decode')).toBe(true);
      expect(scanner.listeners.has('error')).toBe(true);
    });
  });

  describe('removeEventListener', () => {
    test('should remove specific listener', () => {
      const listener1 = MockFactory.createEventListener();
      const listener2 = MockFactory.createEventListener();
      
      scanner.addEventListener('test', listener1);
      scanner.addEventListener('test', listener2);
      scanner.removeEventListener('test', listener1);
      
      const listeners = scanner.listeners.get('test');
      expect(listeners).not.toContain(listener1);
      expect(listeners).toContain(listener2);
    });

    test('should handle removal of non-existent listener', () => {
      const listener = MockFactory.createEventListener();
      
      expect(() => {
        scanner.removeEventListener('test', listener);
      }).not.toThrow();
    });

    test('should handle removal from non-existent event type', () => {
      const listener = MockFactory.createEventListener();
      
      expect(() => {
        scanner.removeEventListener('nonexistent', listener);
      }).not.toThrow();
    });
  });

  describe('dispatchEvent', () => {
    test('should call single listener', () => {
      const listener = MockFactory.createEventListener();
      scanner.addEventListener('test', listener);
      
      const event = MockFactory.createEvent('test', { data: 'test-data' });
      scanner.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalledWith(event);
    });

    test('should call multiple listeners', () => {
      const listener1 = MockFactory.createEventListener();
      const listener2 = MockFactory.createEventListener();
      
      scanner.addEventListener('test', listener1);
      scanner.addEventListener('test', listener2);
      
      const event = MockFactory.createEvent('test');
      scanner.dispatchEvent(event);
      
      expect(listener1).toHaveBeenCalledWith(event);
      expect(listener2).toHaveBeenCalledWith(event);
    });

    test('should handle event with no listeners', () => {
      const event = MockFactory.createEvent('unregistered');
      
      expect(() => {
        scanner.dispatchEvent(event);
      }).not.toThrow();
    });

    test('should pass event detail correctly', () => {
      const listener = MockFactory.createEventListener();
      scanner.addEventListener('decode', listener);
      
      const eventData = { data: 'QR-CODE-DATA' };
      const event = MockFactory.createEvent('decode', eventData);
      scanner.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'decode',
          detail: eventData
        })
      );
    });
  });
});