/**
 * Mock WASM module for testing when WASM is not built
 * This allows tests to run without requiring Emscripten compilation
 */

export default function createMockModule() {
  return Promise.resolve({
    QRErrorCorrection: class MockQRErrorCorrection {
      addErrorCorrection(dataBytes, version, errorCorrectionLevel) {
        // Simple mock implementation that just returns data + some padding
        const padding = new Array(10).fill(0);
        return [...dataBytes, ...padding];
      }
    }
  });
}