export function base64ToUint8Array(base64) {
  const binaryString = atob(base64.split(',')[1] || base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToImageData(uint8Array, width, height) {
  if (uint8Array.length !== width * height * 4) {
    throw new Error('Invalid array length for given dimensions');
  }
  return new ImageData(new Uint8ClampedArray(uint8Array), width, height);
}

export function grayscaleToImageData(grayscaleArray, width, height) {
  const imageData = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < grayscaleArray.length; i++) {
    const pixelIndex = i * 4;
    const gray = grayscaleArray[i];
    imageData[pixelIndex] = gray;     // R
    imageData[pixelIndex + 1] = gray; // G
    imageData[pixelIndex + 2] = gray; // B
    imageData[pixelIndex + 3] = 255;  // A
  }
  return new ImageData(imageData, width, height);
}

export function parseImageFromBase64(base64Data) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Data;
  });
}

export function parseImageFromBuffer(buffer, mimeType = 'image/png') {
  const base64 = uint8ArrayToBase64(buffer);
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return parseImageFromBase64(dataUrl);
}

export function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

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

export function bilinearInterpolation(matrix, x, y) {
  const x1 = Math.floor(x);
  const x2 = Math.ceil(x);
  const y1 = Math.floor(y);
  const y2 = Math.ceil(y);
  
  if (x1 < 0 || x2 >= matrix[0].length || y1 < 0 || y2 >= matrix.length) {
    return 0;
  }
  
  const q11 = matrix[y1][x1];
  const q21 = matrix[y1][x2];
  const q12 = matrix[y2][x1];
  const q22 = matrix[y2][x2];
  
  const wx = x - x1;
  const wy = y - y1;
  
  return (1 - wx) * (1 - wy) * q11 +
         wx * (1 - wy) * q21 +
         (1 - wx) * wy * q12 +
         wx * wy * q22;
}

export function applyPerspectiveTransform(matrix, corners, targetSize) {
  const transformed = Array(targetSize).fill().map(() => Array(targetSize).fill(0));
  
  const [tl, tr, bl, br] = corners;
  
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const u = x / (targetSize - 1);
      const v = y / (targetSize - 1);
      
      const top = {
        x: tl.x + u * (tr.x - tl.x),
        y: tl.y + u * (tr.y - tl.y)
      };
      
      const bottom = {
        x: bl.x + u * (br.x - bl.x),
        y: bl.y + u * (br.y - bl.y)
      };
      
      const point = {
        x: top.x + v * (bottom.x - top.x),
        y: top.y + v * (bottom.y - top.y)
      };
      
      transformed[y][x] = bilinearInterpolation(matrix, point.x, point.y);
    }
  }
  
  return transformed;
}

export function threshold(imageData, thresholdValue = 128) {
  const { data, width, height } = imageData;
  const binary = Array(height).fill().map(() => Array(width).fill(0));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      binary[y][x] = gray < thresholdValue ? 1 : 0;
    }
  }
  
  return binary;
}

export function adaptiveThreshold(imageData, blockSize = 11, C = 2) {
  const { data, width, height } = imageData;
  const binary = Array(height).fill().map(() => Array(width).fill(0));
  const halfBlock = Math.floor(blockSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const i = (ny * width + nx) * 4;
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            count++;
          }
        }
      }
      
      const mean = sum / count;
      const i = (y * width + x) * 4;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      binary[y][x] = gray < (mean - C) ? 1 : 0;
    }
  }
  
  return binary;
}