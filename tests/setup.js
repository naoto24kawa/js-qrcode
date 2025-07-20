global.ImageData = class ImageData {
  constructor(data, width, height) {
    if (typeof data === 'number') {
      this.width = data;
      this.height = width || data;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }
};

// TextEncoder/TextDecoder polyfill for Node.js test environment
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(buffer) {
    return Buffer.from(buffer).toString('utf8');
  }
};

global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
  
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (this.onerror) {
        this.onerror(new Error('Image loading not supported in test environment'));
      }
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};