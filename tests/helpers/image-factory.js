export class ImageDataFactory {
  static create(width = 100, height = 100, fillValue = 128) {
    const length = width * height * 4;
    const data = new Uint8ClampedArray(length);
    
    for (let i = 0; i < length; i += 4) {
      data[i] = fillValue;     // R
      data[i + 1] = fillValue; // G
      data[i + 2] = fillValue; // B
      data[i + 3] = 255;       // A
    }
    
    return new ImageData(data, width, height);
  }

  static createBinary(width = 2, height = 2) {
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Create a checkerboard pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const value = (x + y) % 2 === 0 ? 0 : 255;
        
        data[index] = value;     // R
        data[index + 1] = value; // G
        data[index + 2] = value; // B
        data[index + 3] = 255;   // A
      }
    }
    
    return new ImageData(data, width, height);
  }

  static createGrayscale(width = 10, height = 10) {
    const grayscale = new Uint8Array(width * height);
    
    for (let i = 0; i < grayscale.length; i++) {
      grayscale[i] = (i % 255);
    }
    
    return grayscale;
  }
}

export class Uint8ArrayFactory {
  static create(size = 400, pattern = 'random') {
    const array = new Uint8Array(size);
    
    switch (pattern) {
      case 'zeros':
        array.fill(0);
        break;
      case 'ones':
        array.fill(255);
        break;
      case 'gradient':
        for (let i = 0; i < size; i++) {
          array[i] = (i % 256);
        }
        break;
      default:
        for (let i = 0; i < size; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
    }
    
    return array;
  }

  static createForImageData(width, height, channels = 4) {
    return this.create(width * height * channels, 'gradient');
  }
}