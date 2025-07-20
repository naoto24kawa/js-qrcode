export class SVGRenderer {
  render(modules, moduleSize, settings) {
    const margin = settings.margin || 4;
    const cellSize = settings.moduleSize || 4;
    const totalSize = (moduleSize * cellSize) + (margin * 2 * cellSize);
    
    // 色設定の安全性チェック
    const colors = settings.color || { dark: '#000000', light: '#FFFFFF' };
    const darkColor = colors.dark || '#000000';
    const lightColor = colors.light || '#FFFFFF';
    
    let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${totalSize}px" height="${totalSize}px" viewBox="0 0 ${totalSize} ${totalSize}"  preserveAspectRatio="xMinYMin meet">`;
    
    // 背景（白）
    svg += `<rect width="100%" height="100%" fill="${lightColor}" cx="0" cy="0"/>`;
    
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
      svg += `<path d="${pathData}" stroke="transparent" fill="${darkColor}"/>`;
    }
    
    svg += '</svg>';
    return svg;
  }
}