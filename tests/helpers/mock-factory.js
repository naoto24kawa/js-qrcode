export class MockFactory {
  static createVideoElement(width = 640, height = 480) {
    return {
      tagName: 'VIDEO',
      videoWidth: width,
      videoHeight: height,
      srcObject: null,
      play: jest.fn().mockResolvedValue(undefined)
    };
  }

  static createCanvasElement(width = 640, height = 480) {
    const canvas = {
      tagName: 'CANVAS',
      width,
      height,
      getContext: jest.fn()
    };

    const context = {
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn()
    };

    canvas.getContext.mockReturnValue(context);
    return { canvas, context };
  }

  static createStreamTrack() {
    return {
      stop: jest.fn(),
      kind: 'video'
    };
  }

  static createMediaStream(tracks = []) {
    if (tracks.length === 0) {
      tracks = [this.createStreamTrack()];
    }
    
    return {
      getTracks: jest.fn().mockReturnValue(tracks),
      active: true
    };
  }

  static createImageElement(width = 100, height = 100) {
    return {
      tagName: 'IMG',
      width,
      height,
      naturalWidth: width,
      naturalHeight: height,
      onload: null,
      onerror: null,
      src: ''
    };
  }

  static createEventListener() {
    return jest.fn();
  }

  static createEvent(type, detail = {}) {
    return {
      type,
      detail
    };
  }
}