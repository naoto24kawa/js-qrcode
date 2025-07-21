/**
 * WebAssembly-Enhanced Reed-Solomon Error Correction
 * Provides fallback to JavaScript implementation for compatibility
 */

import { QRErrorCorrection as JSQRErrorCorrection } from './reed-solomon.js';

class WASMReedSolomon {
  constructor(wasmModule) {
    this.wasmModule = wasmModule;
    this.wasmErrorCorrection = new wasmModule.QRErrorCorrection();
  }

  addErrorCorrection(dataBytes, version, errorCorrectionLevel) {
    try {
      // Convert JavaScript array to WASM VectorInt
      const wasmVector = new this.wasmModule.VectorInt();
      for (let i = 0; i < dataBytes.length; i++) {
        wasmVector.push_back(dataBytes[i]);
      }
      
      // Call WASM function
      const result = this.wasmErrorCorrection.addErrorCorrection(
        wasmVector, 
        version, 
        errorCorrectionLevel
      );
      
      // Convert WASM result back to JavaScript array
      const jsArray = [];
      for (let i = 0; i < result.size(); i++) {
        jsArray.push(result.get(i));
      }
      
      // Clean up WASM objects
      wasmVector.delete();
      result.delete();
      
      return jsArray;
    } catch (error) {
      console.warn('WASM Reed-Solomon failed, falling back to JavaScript:', error.message);
      // Fallback to JavaScript implementation
      const jsImplementation = new JSQRErrorCorrection();
      return jsImplementation.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
    }
  }
}

class HybridQRErrorCorrection {
  constructor() {
    this.wasmModule = null;
    this.wasmInstance = null;
    this.jsImplementation = new JSQRErrorCorrection();
    this.initializationPromise = this.initializeWASM();
  }

  async initializeWASM() {
    try {
      // Check if we're in a Workers environment
      const isWorker = typeof importScripts === 'function';
      const isNode = typeof process !== 'undefined' && process.versions?.node;
      
      // Only attempt WASM initialization if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        console.info('WebAssembly not supported, using JavaScript implementation');
        return false;
      }

      // Dynamic import for WASM module (Workers-compatible)
      let createModule;
      try {
        if (isWorker) {
          // In Workers environment, use importScripts if needed
          createModule = (await import('./wasm/reed_solomon.js')).default;
        } else if (isNode) {
          // Node.js environment
          createModule = (await import('./wasm/reed_solomon.js')).default;
        } else {
          // Browser environment
          createModule = (await import('./wasm/reed_solomon.js')).default;
        }
      } catch (importError) {
        // Fallback to mock for testing when WASM is not built
        console.info('WASM module not found, using mock for testing');
        createModule = (await import('./wasm/reed_solomon_mock.js')).default;
      }

      this.wasmModule = await createModule();
      this.wasmInstance = new WASMReedSolomon(this.wasmModule);
      
      console.info('Reed-Solomon WASM module initialized successfully');
      return true;
    } catch (error) {
      console.info('WASM initialization failed, using JavaScript implementation:', error.message);
      return false;
    }
  }

  async addErrorCorrection(dataBytes, version, errorCorrectionLevel) {
    // Wait for WASM initialization to complete
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM execution failed, falling back to JavaScript:', error.message);
      }
    }
    
    // Fallback to JavaScript implementation
    return this.jsImplementation.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
  }

  // Synchronous method for cases where WASM initialization has completed
  addErrorCorrectionSync(dataBytes, version, errorCorrectionLevel) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
      } catch (error) {
        console.warn('WASM execution failed, falling back to JavaScript:', error.message);
      }
    }
    
    // Fallback to JavaScript implementation
    return this.jsImplementation.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
  }

  // Method to check if WASM is ready
  isWASMReady() {
    return this.wasmInstance !== null;
  }

  // Method to force JavaScript implementation (for testing or compatibility)
  forceJavaScript() {
    this.wasmInstance = null;
    console.info('Forced fallback to JavaScript Reed-Solomon implementation');
  }
}

// Factory function for creating error correction instances
export function createQRErrorCorrection(forceJS = false) {
  if (forceJS) {
    return new JSQRErrorCorrection();
  }
  return new HybridQRErrorCorrection();
}

// Export both implementations for flexibility
export { HybridQRErrorCorrection, HybridQRErrorCorrection as QRErrorCorrection };
export { JSQRErrorCorrection };
export { WASMReedSolomon };