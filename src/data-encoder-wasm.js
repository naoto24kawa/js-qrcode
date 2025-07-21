/**
 * WebAssembly-Enhanced QR Data Encoding
 * Provides fallback to JavaScript implementation for compatibility
 */

import { QRDataEncoder as JSQRDataEncoder } from './data-encoder.js';

class WASMDataEncoder {
  constructor(wasmModule) {
    this.wasmModule = wasmModule;
    this.wasmDataEncoder = new wasmModule.QRDataEncoderWASM();
    // Store mode constants
    this.QR_MODE_NUMERIC = wasmModule.QR_MODE_NUMERIC;
    this.QR_MODE_ALPHANUMERIC = wasmModule.QR_MODE_ALPHANUMERIC;
    this.QR_MODE_BYTE = wasmModule.QR_MODE_BYTE;
  }

  detectMode(data) {
    try {
      return this.wasmDataEncoder.detectMode(data);
    } catch (error) {
      console.warn('WASM data encoding failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.detectMode(data);
    }
  }

  determineVersion(data, mode, errorCorrectionLevel) {
    try {
      return this.wasmDataEncoder.determineVersion(data, mode, errorCorrectionLevel);
    } catch (error) {
      console.warn('WASM version determination failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.determineVersion(data, mode, errorCorrectionLevel);
    }
  }

  encode(data, mode, version) {
    try {
      return this.wasmDataEncoder.encode(data, mode, version);
    } catch (error) {
      console.warn('WASM data encoding failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.encode(data, mode, version);
    }
  }

  encodeToBytes(data, mode, version, errorCorrectionLevel) {
    try {
      const result = this.wasmDataEncoder.encodeToBytes(data, mode, version, errorCorrectionLevel);
      return Array.from(result);
    } catch (error) {
      console.warn('WASM byte encoding failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.encodeToBytes(data, mode, version, errorCorrectionLevel);
    }
  }

  getModeIndex(mode) {
    try {
      return this.wasmDataEncoder.getModeIndex(mode);
    } catch (error) {
      console.warn('WASM mode index failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.getModeIndex(mode);
    }
  }

  isAlphanumeric(data) {
    try {
      return this.wasmDataEncoder.isAlphanumeric(data);
    } catch (error) {
      console.warn('WASM alphanumeric check failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.isAlphanumeric(data);
    }
  }

  stringToUtf8Bytes(data) {
    try {
      const result = this.wasmDataEncoder.getUtf8Bytes(data);
      return Array.from(result);
    } catch (error) {
      console.warn('WASM UTF-8 conversion failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRDataEncoder();
      return jsImplementation.stringToUtf8Bytes(data);
    }
  }
}

class HybridQRDataEncoder {
  constructor() {
    this.wasmModule = null;
    this.wasmInstance = null;
    this.jsImplementation = new JSQRDataEncoder();
    this.initializationPromise = this.initializeWASM();
  }

  async initializeWASM() {
    try {
      // Check if we're in a Workers environment
      const isWorker = typeof importScripts === 'function';
      const isNode = typeof process !== 'undefined' && process.versions?.node;
      
      // Only attempt WASM initialization if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        console.info('WebAssembly not supported, using JavaScript data encoding implementation');
        return false;
      }

      // Dynamic import for WASM module (Workers-compatible)
      let createModule;
      try {
        if (isWorker) {
          createModule = (await import('./wasm/data_encoder.js')).default;
        } else if (isNode) {
          createModule = (await import('./wasm/data_encoder.js')).default;
        } else {
          createModule = (await import('./wasm/data_encoder.js')).default;
        }
      } catch (importError) {
        // Fallback to mock for testing when WASM is not built
        console.info('WASM data encoder module not found, using mock for testing');
        createModule = (await import('./wasm/data_encoder_mock.js')).default;
      }

      this.wasmModule = await createModule();
      this.wasmInstance = new WASMDataEncoder(this.wasmModule);
      
      console.info('QR Data Encoder WASM module initialized successfully');
      return true;
    } catch (error) {
      console.info('WASM data encoder initialization failed, using JavaScript implementation:', error.message);
      return false;
    }
  }

  async detectMode(data) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.detectMode(data);
      } catch (error) {
        console.warn('WASM mode detection failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.detectMode(data);
  }

  async determineVersion(data, mode, errorCorrectionLevel) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.determineVersion(data, mode, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM version determination failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.determineVersion(data, mode, errorCorrectionLevel);
  }

  async encode(data, mode, version) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.encode(data, mode, version);
      } catch (error) {
        console.warn('WASM data encoding failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.encode(data, mode, version);
  }

  async encodeToBytes(data, mode, version, errorCorrectionLevel) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.encodeToBytes(data, mode, version, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM byte encoding failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.encodeToBytes(data, mode, version, errorCorrectionLevel);
  }

  // Synchronous methods for cases where WASM initialization has completed
  detectModeSync(data) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.detectMode(data);
      } catch (error) {
        console.warn('WASM mode detection failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.detectMode(data);
  }

  determineVersionSync(data, mode, errorCorrectionLevel) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.determineVersion(data, mode, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM version determination failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.determineVersion(data, mode, errorCorrectionLevel);
  }

  encodeSync(data, mode, version) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.encode(data, mode, version);
      } catch (error) {
        console.warn('WASM data encoding failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.encode(data, mode, version);
  }

  encodeToBytesSync(data, mode, version, errorCorrectionLevel) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.encodeToBytes(data, mode, version, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM byte encoding failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.encodeToBytes(data, mode, version, errorCorrectionLevel);
  }

  // Method to check if WASM is ready
  isWASMReady() {
    return this.wasmInstance !== null;
  }

  // Method to force JavaScript implementation (for testing or compatibility)
  forceJavaScript() {
    this.wasmInstance = null;
    console.info('Forced fallback to JavaScript data encoding implementation');
  }

  // Delegate other methods to JavaScript implementation
  getModeIndex(mode) {
    return this.jsImplementation.getModeIndex(mode);
  }

  isAlphanumeric(data) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.isAlphanumeric(data);
      } catch (error) {
        console.warn('WASM alphanumeric check failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.isAlphanumeric(data);
  }

  stringToUtf8Bytes(data) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.stringToUtf8Bytes(data);
      } catch (error) {
        console.warn('WASM UTF-8 conversion failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.stringToUtf8Bytes(data);
  }

  // Delegate methods that are rarely performance-critical
  getCharacterCountLength(mode, version) {
    return this.jsImplementation.getCharacterCountLength(mode, version);
  }

  getDataCodewordsCount(version, errorCorrectionLevel) {
    return this.jsImplementation.getDataCodewordsCount(version, errorCorrectionLevel);
  }

  padLeft(str, length, padChar = '0') {
    return this.jsImplementation.padLeft(str, length, padChar);
  }

  encodeNumeric(data) {
    return this.jsImplementation.encodeNumeric(data);
  }

  encodeAlphanumeric(data) {
    return this.jsImplementation.encodeAlphanumeric(data);
  }

  encodeByte(data) {
    return this.jsImplementation.encodeByte(data);
  }

  encodeByMode(data, mode) {
    return this.jsImplementation.encodeByMode(data, mode);
  }

  bitsToBytes(bits) {
    return this.jsImplementation.bitsToBytes(bits);
  }
}

// Factory function for creating data encoder instances
export function createQRDataEncoder(forceJS = false) {
  if (forceJS) {
    return new JSQRDataEncoder();
  }
  return new HybridQRDataEncoder();
}

// Export both implementations for flexibility
export { HybridQRDataEncoder, HybridQRDataEncoder as QRDataEncoder };
export { JSQRDataEncoder };
export { WASMDataEncoder };