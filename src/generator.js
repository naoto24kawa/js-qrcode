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
    
    if (settings.format === 'png') {
      return this.buildPNG(modules, moduleSize, settings);
    }
    
    return this.buildOptimizedSVG(modules, moduleSize, settings);
  }

  /**
   * 最適化されたSVG生成 - qrcode-generatorと同じ仕様
   */
  buildOptimizedSVG(modules, moduleSize, settings) {
    const margin = settings.margin;
    const cellSize = 10; // qrcode-generatorと同じセルサイズ
    const totalSize = (moduleSize * cellSize) + (margin * 2 * cellSize);
    
    let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${totalSize}px" height="${totalSize}px" viewBox="0 0 ${totalSize} ${totalSize}"  preserveAspectRatio="xMinYMin meet">`;
    
    // 背景（白）
    svg += `<rect width="100%" height="100%" fill="${settings.color.light}" cx="0" cy="0"/>`;
    
    // 黒いモジュールを矩形で描画
    let pathData = '';
    for (let row = 0; row < moduleSize; row++) {
      for (let col = 0; col < moduleSize; col++) {
        if (modules[row][col]) {
          const x = (margin * cellSize) + (col * cellSize);
          const y = (margin * cellSize) + (row * cellSize);
          pathData += `M${x},${y}l${cellSize},0 0,${cellSize} -${cellSize},0 0,-${cellSize}z `;
        }
      }
    }
    
    if (pathData) {
      svg += `<path d="${pathData}" stroke="transparent" fill="${settings.color.dark}"/>`;
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * 最適化されたpath文字列生成 - 参考ライブラリと同じアルゴリズム
   */
  generateOptimizedPath(modules, moduleSize, margin) {
    const segments = [];
    
    for (let row = 0; row < moduleSize; row++) {
      const y = margin + row + 0.5;
      const rowSegments = this.generateRowPath(modules[row], margin, y);
      if (rowSegments.length > 0) {
        segments.push(rowSegments);
      }
    }
    
    return segments.join('');
  }

  /**
   * 1行のpath生成 - 参考ライブラリ(node-qrcode)の正確なアルゴリズムを再現
   * node-qrcode/lib/renderer/svg-tag.js の qrToPath関数を参考
   */
  generateRowPath(row, margin, y) {
    if (!row || row.length === 0) return '';
    
    let path = '';
    let col = 0;
    let lineLength = 0;
    let moveBy = 0;
    let newRow = true;
    
    for (col = 0; col < row.length; col++) {
      if (row[col]) {
        // 黒モジュールの場合
        lineLength++;
      } else {
        // 白モジュールの場合
        if (lineLength > 0) {
          // 前の黒モジュールのセグメントを出力
          path += newRow
            ? `M${col - lineLength + margin} ${y}h${lineLength}`
            : `m${moveBy} 0h${lineLength}`;
          
          lineLength = 0;
          newRow = false;
          moveBy = 0;
        }
        moveBy++;
      }
    }
    
    // 行の最後に黒モジュールがある場合
    if (lineLength > 0) {
      path += newRow
        ? `M${col - lineLength + margin} ${y}h${lineLength}`
        : `m${moveBy} 0h${lineLength}`;
    }
    
    return path;
  }

  /**
   * PNG生成（Node.js対応）
   */
  buildPNG(modules, moduleSize, settings) {
    // ブラウザ環境ではCanvas APIを使用
    if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
      return this.buildCanvasPNG(modules, moduleSize, settings);
    }
    
    // Node.js環境ではSVGベースのData URLを返す
    const svgData = this.buildOptimizedSVG(modules, moduleSize, settings);
    const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  /**
   * Canvas APIを使用したPNG生成（ブラウザ環境）
   */
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