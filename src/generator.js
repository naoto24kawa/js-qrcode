import { QRCodeEncoder } from './encoder.js';
import { DEFAULT_OPTIONS } from './constants.js';
import { SVGRenderer } from './renderers/svg-renderer.js';
import { PNGRenderer } from './renderers/png-renderer.js';

export class QRCodeGenerator {
  constructor(svgRenderer = new SVGRenderer(), pngRenderer = new PNGRenderer(), encoderOptions = {}) {
    this.encoder = new QRCodeEncoder(encoderOptions);
    this.svgRenderer = svgRenderer;
    this.pngRenderer = pngRenderer;
  }
  
  async generate(data, options = {}) {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    
    const encoded = await this.encoder.encode(data, settings.errorCorrectionLevel, options);
    const { modules, size: moduleSize } = encoded;
    
    let output;
    if (settings.format === 'png') {
      output = this.pngRenderer.render(modules, moduleSize, settings);
    } else {
      output = this.svgRenderer.render(modules, moduleSize, settings);
    }
    
    // 完全な結果オブジェクトを返す
    return {
      ...encoded,
      svg: settings.format !== 'png' ? output : undefined,
      png: settings.format === 'png' ? output : undefined,
      settings
    };
  }

}