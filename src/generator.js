import { QRCodeEncoder } from './encoder.js';
import { DEFAULT_OPTIONS } from './constants.js';

export class QRCodeGenerator {
  constructor() {
    this.encoder = new QRCodeEncoder();
  }
  
  generate(data, options = {}) {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    
    const encoded = this.encoder.encode(data, settings.errorCorrectionLevel);
    const { modules, size: moduleSize } = encoded;
    
    // Ensure minimum 4 module quiet zone as per QR spec
    const quietZoneModules = Math.max(4, settings.margin);
    const totalModules = moduleSize + (quietZoneModules * 2);
    const modulePixelSize = settings.size / totalModules;
    const marginSize = quietZoneModules * modulePixelSize;
    const actualSize = settings.size;
    
    return this.buildSVG(modules, moduleSize, actualSize, marginSize, modulePixelSize, settings.color);
  }

  buildSVG(modules, moduleSize, actualSize, marginSize, modulePixelSize, color) {
    let svg = `<svg width="${actualSize}" height="${actualSize}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${actualSize}" height="${actualSize}" fill="${color.light}"/>`;
    
    for (let row = 0; row < moduleSize; row++) {
      for (let col = 0; col < moduleSize; col++) {
        if (modules[row][col]) {
          const x = marginSize + col * modulePixelSize;
          const y = marginSize + row * modulePixelSize;
          svg += `<rect x="${x}" y="${y}" width="${modulePixelSize}" height="${modulePixelSize}" fill="${color.dark}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }
}