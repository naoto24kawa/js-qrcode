import { QRCodeEncoder } from './encoder.js';
import { DEFAULT_OPTIONS } from './constants.js';
import { SVGRenderer } from './renderers/svg-renderer.js';
import { PNGRenderer } from './renderers/png-renderer.js';

export class QRCodeGenerator {
  constructor(svgRenderer = new SVGRenderer(), pngRenderer = new PNGRenderer()) {
    this.encoder = new QRCodeEncoder();
    this.svgRenderer = svgRenderer;
    this.pngRenderer = pngRenderer;
  }
  
  generate(data, options = {}) {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    
    const encoded = this.encoder.encode(data, settings.errorCorrectionLevel);
    const { modules, size: moduleSize } = encoded;
    
    if (settings.format === 'png') {
      return this.pngRenderer.render(modules, moduleSize, settings);
    }
    
    return this.svgRenderer.render(modules, moduleSize, settings);
  }

}