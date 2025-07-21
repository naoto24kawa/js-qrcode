// General utility functions for QR code generation

export function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function codewordsToBits(codewords) {
  let bits = '';
  for (const codeword of codewords) {
    bits += codeword.toString(2).padStart(8, '0');
  }
  return bits;
}