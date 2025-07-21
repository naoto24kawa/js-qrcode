export function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isValidFinderPattern(pattern) {
  if (!pattern || pattern.length !== 7) return false;
  
  const expected = [1, 1, 1, 1, 1, 1, 1];
  for (let i = 0; i < 7; i++) {
    if (pattern[i] !== expected[i]) return false;
  }
  return true;
}