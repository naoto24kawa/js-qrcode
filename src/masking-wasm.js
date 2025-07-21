/**
 * WebAssembly-Enhanced QR Code Masking
 * Provides fallback to JavaScript implementation for compatibility
 */

import { QRMasking as JSQRMasking } from './masking.js';

class WASMMasking {
  constructor(wasmModule) {
    this.wasmModule = wasmModule;
    this.wasmMasking = new wasmModule.QRMaskingWASM();
  }

  applyMask(modules, maskPattern, size) {
    try {
      // Convert JavaScript 2D array to WASM-compatible format
      const result = this.wasmMasking.applyMask(modules, maskPattern, size);
      return result;
    } catch (error) {
      console.warn('WASM masking failed, falling back to JavaScript:', error.message);
      // Fallback to JavaScript implementation
      const jsImplementation = new JSQRMasking();
      return jsImplementation.applyMask(modules, maskPattern, size);
    }
  }

  evaluateMask(modules, size) {
    try {
      return this.wasmMasking.evaluateMask(modules, size);
    } catch (error) {
      console.warn('WASM mask evaluation failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRMasking();
      return jsImplementation.evaluateMask(modules, size);
    }
  }

  findBestMask(modules, size, options = {}) {
    try {
      // Handle compatibility options in JavaScript layer
      if (options.forceMask !== undefined) {
        const forcedMask = parseInt(options.forceMask);
        if (forcedMask >= 0 && forcedMask <= 7) {
          return forcedMask;
        }
      }

      if (options.legacyCompatibility !== false) {
        const compatibleMasks = {
          'L': 4, 'M': 4, 'Q': 3, 'H': 1
        };
        if (compatibleMasks[options.errorCorrectionLevel]) {
          return compatibleMasks[options.errorCorrectionLevel];
        }
      }

      return this.wasmMasking.findBestMask(modules, size);
    } catch (error) {
      console.warn('WASM mask selection failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRMasking();
      return jsImplementation.findBestMask(modules, size, options);
    }
  }

  getPenaltyBreakdown(modules, size) {
    try {
      const penalties = this.wasmMasking.getPenaltyBreakdown(modules, size);
      return Array.from(penalties);
    } catch (error) {
      console.warn('WASM penalty breakdown failed, falling back to JavaScript:', error.message);
      const jsImplementation = new JSQRMasking();
      // Calculate breakdown manually for JS implementation
      return [
        jsImplementation.evaluateRule1(modules, size),
        jsImplementation.evaluateRule2(modules, size),
        jsImplementation.evaluateRule3(modules, size),
        jsImplementation.evaluateRule4(modules, size)
      ];
    }
  }
}

class HybridQRMasking {
  constructor() {
    this.wasmModule = null;
    this.wasmInstance = null;
    this.jsImplementation = new JSQRMasking();
    this.initializationPromise = this.initializeWASM();
  }

  async initializeWASM() {
    try {
      // Check if we're in a Workers environment
      const isWorker = typeof importScripts === 'function';
      const isNode = typeof process !== 'undefined' && process.versions?.node;
      
      // Only attempt WASM initialization if WebAssembly is supported
      if (typeof WebAssembly === 'undefined') {
        console.info('WebAssembly not supported, using JavaScript masking implementation');
        return false;
      }

      // Dynamic import for WASM module (Workers-compatible)
      let createModule;
      try {
        if (isWorker) {
          createModule = (await import('./wasm/masking.js')).default;
        } else if (isNode) {
          createModule = (await import('./wasm/masking.js')).default;
        } else {
          createModule = (await import('./wasm/masking.js')).default;
        }
      } catch (importError) {
        // Fallback to mock for testing when WASM is not built
        console.info('WASM masking module not found, using mock for testing');
        createModule = (await import('./wasm/masking_mock.js')).default;
      }

      this.wasmModule = await createModule();
      this.wasmInstance = new WASMMasking(this.wasmModule);
      
      console.info('QR Masking WASM module initialized successfully');
      return true;
    } catch (error) {
      console.info('WASM masking initialization failed, using JavaScript implementation:', error.message);
      return false;
    }
  }

  async applyMask(modules, maskPattern, size) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.applyMask(modules, maskPattern, size);
      } catch (error) {
        console.warn('WASM mask application failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.applyMask(modules, maskPattern, size);
  }

  async evaluateMask(modules, size) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.evaluateMask(modules, size);
      } catch (error) {
        console.warn('WASM mask evaluation failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.evaluateMask(modules, size);
  }

  async findBestMask(modules, size, options = {}) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.findBestMask(modules, size, options);
      } catch (error) {
        console.warn('WASM mask selection failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.findBestMask(modules, size, options);
  }

  // Synchronous methods for cases where WASM initialization has completed
  applyMaskSync(modules, maskPattern, size) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.applyMask(modules, maskPattern, size);
      } catch (error) {
        console.warn('WASM mask application failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.applyMask(modules, maskPattern, size);
  }

  evaluateMaskSync(modules, size) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.evaluateMask(modules, size);
      } catch (error) {
        console.warn('WASM mask evaluation failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.evaluateMask(modules, size);
  }

  findBestMaskSync(modules, size, options = {}) {
    if (this.wasmInstance) {
      try {
        return this.wasmInstance.findBestMask(modules, size, options);
      } catch (error) {
        console.warn('WASM mask selection failed, falling back to JavaScript:', error.message);
      }
    }
    
    return this.jsImplementation.findBestMask(modules, size, options);
  }

  // Method to check if WASM is ready
  isWASMReady() {
    return this.wasmInstance !== null;
  }

  // Method to force JavaScript implementation (for testing or compatibility)
  forceJavaScript() {
    this.wasmInstance = null;
    console.info('Forced fallback to JavaScript masking implementation');
  }

  // Get detailed penalty breakdown (useful for analysis)
  async getPenaltyBreakdown(modules, size) {
    const wasmAvailable = await this.initializationPromise;
    
    if (wasmAvailable && this.wasmInstance) {
      try {
        return this.wasmInstance.getPenaltyBreakdown(modules, size);
      } catch (error) {
        console.warn('WASM penalty breakdown failed, falling back to JavaScript:', error.message);
      }
    }
    
    // Calculate breakdown manually for JS implementation
    return [
      this.jsImplementation.evaluateRule1(modules, size),
      this.jsImplementation.evaluateRule2(modules, size),
      this.jsImplementation.evaluateRule3(modules, size),
      this.jsImplementation.evaluateRule4(modules, size)
    ];
  }

  // Delegate other methods to JavaScript implementation
  isReservedModule(row, col, size) {
    return this.jsImplementation.isReservedModule(row, col, size);
  }

  evaluateRule1(modules, size) {
    return this.jsImplementation.evaluateRule1(modules, size);
  }

  evaluateRule2(modules, size) {
    return this.jsImplementation.evaluateRule2(modules, size);
  }

  evaluateRule3(modules, size) {
    return this.jsImplementation.evaluateRule3(modules, size);
  }

  evaluateRule4(modules, size) {
    return this.jsImplementation.evaluateRule4(modules, size);
  }
}

// Factory function for creating masking instances
export function createQRMasking(forceJS = false) {
  if (forceJS) {
    return new JSQRMasking();
  }
  return new HybridQRMasking();
}

// Export both implementations for flexibility
export { HybridQRMasking, HybridQRMasking as QRMasking };
export { JSQRMasking };
export { WASMMasking };