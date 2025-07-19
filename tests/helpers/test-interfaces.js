// DIP準拠：テストインターフェースの定義

export class TestableEncoder {
  encode(data, errorCorrectionLevel) {
    throw new Error('Must implement encode method');
  }
  
  detectMode(data) {
    throw new Error('Must implement detectMode method');
  }
  
  determineVersion(data, mode, errorCorrectionLevel) {
    throw new Error('Must implement determineVersion method');
  }
}

export class TestableGenerator {
  generate(data, options = {}) {
    throw new Error('Must implement generate method');
  }
}

export class TestableDecoder {
  decode(inputData, options = {}) {
    throw new Error('Must implement decode method');
  }
}

export class TestableScanner {
  start() {
    throw new Error('Must implement start method');
  }
  
  stop() {
    throw new Error('Must implement stop method');
  }
  
  on(event, callback) {
    throw new Error('Must implement on method');
  }
}

// Factory for creating testable instances
export class TestInstanceFactory {
  static createEncoder() {
    const { QRCodeEncoder } = require('../../src/encoder.js');
    const instance = new QRCodeEncoder();
    
    // Ensure interface compliance
    if (!instance.encode || !instance.detectMode || !instance.determineVersion) {
      throw new Error('Encoder implementation does not match TestableEncoder interface');
    }
    
    return instance;
  }
  
  static createGenerator() {
    const { QRCodeGenerator } = require('../../src/generator.js');
    const instance = new QRCodeGenerator();
    
    if (!instance.generate) {
      throw new Error('Generator implementation does not match TestableGenerator interface');
    }
    
    return instance;
  }
  
  static createDecoder() {
    const { QRCodeDecoder } = require('../../src/decoder.js');
    const instance = new QRCodeDecoder();
    
    if (!instance.decode) {
      throw new Error('Decoder implementation does not match TestableDecoder interface');
    }
    
    return instance;
  }
  
  static createScanner(options = {}) {
    try {
      const { QRCodeScanner } = require('../../src/scanner.js');
      const instance = new QRCodeScanner(options);
      
      if (!instance.start || !instance.stop || !instance.on) {
        throw new Error('Scanner implementation does not match TestableScanner interface');
      }
      
      return instance;
    } catch (error) {
      // Handle test environment gracefully
      return null;
    }
  }
}