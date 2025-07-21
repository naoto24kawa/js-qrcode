/**
 * Mock Masking WASM module for testing when WASM is not built
 * This allows tests to run without requiring Emscripten compilation
 */

export default function createMockModule() {
  return Promise.resolve({
    QRMaskingWASM: class MockQRMaskingWASM {
      applyMask(modules, maskPattern, size) {
        // Simple mock implementation - just return a copy
        return modules.map(row => [...row]);
      }

      evaluateMask(modules, size) {
        // Simple mock penalty calculation
        let penalty = 0;
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (modules[row][col]) {
              penalty += 1;
            }
          }
        }
        return penalty;
      }

      findBestMask(modules, size) {
        // Always return mask pattern 0 for mock
        return 0;
      }

      getPenaltyBreakdown(modules, size) {
        // Mock penalty breakdown
        const total = this.evaluateMask(modules, size);
        return [
          Math.floor(total * 0.4),  // Rule 1
          Math.floor(total * 0.3),  // Rule 2
          Math.floor(total * 0.2),  // Rule 3
          Math.floor(total * 0.1)   // Rule 4
        ];
      }

      evaluateRule1(modules, size) {
        return Math.floor(this.evaluateMask(modules, size) * 0.4);
      }

      evaluateRule2(modules, size) {
        return Math.floor(this.evaluateMask(modules, size) * 0.3);
      }

      evaluateRule3(modules, size) {
        return Math.floor(this.evaluateMask(modules, size) * 0.2);
      }

      evaluateRule4(modules, size) {
        return Math.floor(this.evaluateMask(modules, size) * 0.1);
      }
    }
  });
}