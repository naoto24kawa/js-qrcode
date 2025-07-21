/**
 * Mock Data Encoder WASM module for testing when WASM is not built
 * This allows tests to run without requiring Emscripten compilation
 */

export default function createMockModule() {
  return Promise.resolve({
    QRDataEncoderWASM: class MockQRDataEncoderWASM {
      detectMode(data) {
        // Simple mock mode detection
        if (/^[0-9]+$/.test(data)) {
          return 1; // QR_MODE_NUMERIC
        } else if (/^[0-9A-Z $%*+\-./:]+$/.test(data)) {
          return 2; // QR_MODE_ALPHANUMERIC
        }
        return 4; // QR_MODE_BYTE
      }

      determineVersion(data, mode, errorCorrectionLevel) {
        // Simple mock version determination
        const length = data.length;
        if (length <= 25) return 1;
        if (length <= 47) return 2;
        if (length <= 77) return 3;
        if (length <= 114) return 4;
        return Math.min(15, Math.ceil(length / 30));
      }

      encode(data, mode, version) {
        // Simple mock encoding - just return a bit string representation
        let bits = '';
        
        // Mode indicator (4 bits)
        bits += mode.toString(2).padStart(4, '0');
        
        // Character count (simplified)
        const lengthBits = mode === 1 ? 10 : mode === 2 ? 9 : 8;
        bits += data.length.toString(2).padStart(lengthBits, '0');
        
        // Data (simplified - just convert each character to 8-bit)
        for (let i = 0; i < data.length; i++) {
          bits += data.charCodeAt(i).toString(2).padStart(8, '0');
        }
        
        return bits;
      }

      encodeToBytes(data, mode, version, errorCorrectionLevel) {
        // Simple mock byte encoding
        const bytes = [];
        
        // Mode and length
        bytes.push(mode << 4 | (data.length >> 4));
        bytes.push((data.length & 0x0F) << 4);
        
        // Data bytes
        for (let i = 0; i < data.length; i++) {
          bytes.push(data.charCodeAt(i));
        }
        
        // Padding to simulate real output length
        while (bytes.length < 16) {
          bytes.push(0xEC); // Standard padding byte
        }
        
        return bytes.slice(0, 16);
      }

      getModeIndex(mode) {
        switch (mode) {
          case 1: return 0; // Numeric
          case 2: return 1; // Alphanumeric
          case 4: return 2; // Byte
          default: return 2;
        }
      }

      isAlphanumeric(data) {
        return /^[0-9A-Z $%*+\-./:]*$/.test(data);
      }

      getUtf8Bytes(data) {
        // Simple UTF-8 byte conversion
        const bytes = [];
        for (let i = 0; i < data.length; i++) {
          const code = data.charCodeAt(i);
          if (code <= 0x7F) {
            bytes.push(code);
          } else if (code <= 0x7FF) {
            bytes.push(0xC0 | (code >> 6));
            bytes.push(0x80 | (code & 0x3F));
          } else {
            bytes.push(0xE0 | (code >> 12));
            bytes.push(0x80 | ((code >> 6) & 0x3F));
            bytes.push(0x80 | (code & 0x3F));
          }
        }
        return bytes;
      }
    },
    
    // Mock mode constants
    QR_MODE_NUMERIC: 1,
    QR_MODE_ALPHANUMERIC: 2,
    QR_MODE_BYTE: 4
  });
}