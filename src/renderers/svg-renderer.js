export class SVGRenderer {
  render(modules, moduleSize, settings) {
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
}