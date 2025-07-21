import { FINDER_PATTERN } from './constants.js';

export function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isValidFinderPattern(pattern) {
  if (!pattern || pattern.length !== 7) return false;
  
  for (let i = 0; i < 7; i++) {
    if (pattern[i] !== FINDER_PATTERN[0][i]) return false;
  }
  return true;
}