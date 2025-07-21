import { SVGRenderer } from './svg-renderer.js';

export class PNGRenderer {
  render(modules, moduleSize, settings) {
    // ブラウザ環境ではCanvas APIを使用
    if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
      return this.buildCanvasPNG(modules, moduleSize, settings);
    }
    
    // Node.js環境ではSVGベースのData URLを返す
    const svgRenderer = new SVGRenderer();
    const svgData = svgRenderer.render(modules, moduleSize, settings);
    const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  buildCanvasPNG(modules, moduleSize, settings) {
    const margin = settings.margin;
    const scale = Math.floor(settings.size / (moduleSize + margin * 2));
    const actualSize = (moduleSize + margin * 2) * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = actualSize;
    canvas.height = actualSize;
    
    const ctx = canvas.getContext('2d');
    
    // アンチエイリアシング無効化
    ctx.imageSmoothingEnabled = false;
    
    // 背景
    ctx.fillStyle = settings.color.light;
    ctx.fillRect(0, 0, actualSize, actualSize);
    
    // QRモジュール
    ctx.fillStyle = settings.color.dark;
    
    for (let row = 0; row < moduleSize; row++) {
      for (let col = 0; col < moduleSize; col++) {
        if (modules[row][col]) {
          const x = (margin + col) * scale;
          const y = (margin + row) * scale;
          ctx.fillRect(x, y, scale, scale);
        }
      }
    }
    
    return canvas.toDataURL('image/png', 1.0);
  }
}