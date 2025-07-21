// Format information patterns for QR Code specification
export const FORMAT_INFO_PATTERNS = {
  'L': {  // Low error correction (ECL=01)
    row8: [1,1,0,0,1,1,1,0,0,0,0,0,1,0,0,1,0,1,1,1,1],
    col8: [1,1,1,1,0,1,1,0,0,0,0,0,0,1,0,1,1,0,0,1,1]
  },
  'M': {  // Medium error correction (ECL=00)
    row8: [1,0,0,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1],
    col8: [1,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,1,0,0,0,1]
  },
  'Q': {  // Quartile error correction (ECL=11)
    row8: [0,1,1,1,0,1,1,0,0,1,0,1,0,0,0,0,0,0,1,1,0],
    col8: [0,1,1,0,0,0,1,0,0,0,1,1,0,1,0,1,0,1,1,1,0]
  },
  'H': {  // High error correction (ECL=10)
    row8: [0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    col8: [1,0,1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,0,0]
  }
};