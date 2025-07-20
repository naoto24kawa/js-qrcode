import { SVGRenderer } from '../../src/renderers/svg-renderer.js';

describe('SVGRenderer', () => {
  let renderer;
  
  beforeEach(() => {
    renderer = new SVGRenderer();
  });

  describe('基本的なレンダリング', () => {
    test('シンプルなQRコードがSVGとして正しくレンダリングされる', () => {
      const modules = [
        [true, false, true],
        [false, true, false],
        [true, false, true]
      ];
      const moduleSize = 3;
      const settings = {
        margin: 1,
        moduleSize: 10,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('<svg');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('</svg>');
    });

    test('SVGの寸法が正しく計算される', () => {
      const modules = [
        [true, false],
        [false, true]
      ];
      const moduleSize = 2;
      const settings = {
        margin: 2,
        moduleSize: 5,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);
      const expectedSize = (2 * 5) + (2 * 2 * 5); // (moduleSize * cellSize) + (margin * 2 * cellSize)

      expect(result).toContain(`width="${expectedSize}px"`);
      expect(result).toContain(`height="${expectedSize}px"`);
      expect(result).toContain(`viewBox="0 0 ${expectedSize} ${expectedSize}"`);
    });
  });

  describe('色設定', () => {
    test('カスタム色が正しく適用される', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#ff0000', light: '#00ff00' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('fill="#00ff00"'); // 背景
      expect(result).toContain('fill="#ff0000"'); // フォアグラウンド
    });

    test('色設定が不正な場合デフォルト色が使用される', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: null
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('fill="#FFFFFF"'); // デフォルト背景
      expect(result).toContain('fill="#000000"'); // デフォルトフォアグラウンド
    });

    test('部分的な色設定でもフォールバックが機能する', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#ff0000' } // lightが未定義
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('fill="#FFFFFF"'); // デフォルト背景
      expect(result).toContain('fill="#ff0000"'); // 指定されたフォアグラウンド
    });
  });

  describe('マージンとモジュールサイズ', () => {
    test('マージンが正しく適用される', () => {
      const modules = [[true, false], [false, true]];
      const moduleSize = 2;
      const settings = {
        margin: 3,
        moduleSize: 8,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);
      
      // マージンが考慮された座標が含まれているかチェック
      const marginOffset = 3 * 8; // margin * cellSize
      expect(result).toContain(`M${marginOffset},${marginOffset}`); // 最初のモジュールの位置
    });

    test('モジュールサイズが正しく適用される', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 0,
        moduleSize: 6,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);
      
      // セルサイズがモジュールサイズに設定されているかチェック
      expect(result).toContain(`l${6},0 0,${6} -${6},0 0,-${6}z`); // セル描画パス
    });

    test('設定が未定義の場合デフォルト値が使用される', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {}; // 空の設定

      const result = renderer.render(modules, moduleSize, settings);

      // デフォルト値でレンダリングが成功することを確認
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });
  });

  describe('モジュール描画', () => {
    test('trueのモジュールのみが描画される', () => {
      const modules = [
        [true, false, true],
        [false, false, false],
        [true, false, true]
      ];
      const moduleSize = 3;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      // パスデータが含まれているかチェック（trueのモジュールが4つあるため）
      const pathMatches = result.match(/M\d+,\d+l/g);
      expect(pathMatches).toHaveLength(4); // true のモジュールの数
    });

    test('すべてfalseのモジュールでは空のパスが生成される', () => {
      const modules = [
        [false, false],
        [false, false]
      ];
      const moduleSize = 2;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      // パスデータが空であることを確認
      expect(result).not.toContain('<path');
    });

    test('モジュール座標が正しく計算される', () => {
      const modules = [
        [true, false],
        [false, true]
      ];
      const moduleSize = 2;
      const settings = {
        margin: 2,
        moduleSize: 5,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      const marginOffset = 2 * 5; // margin * cellSize = 10
      const cellSize = 5;
      
      // 最初のモジュール (0,0) の座標
      expect(result).toContain(`M${marginOffset},${marginOffset}`);
      
      // 2番目のモジュール (1,1) の座標
      const secondModuleX = marginOffset + cellSize;
      const secondModuleY = marginOffset + cellSize;
      expect(result).toContain(`M${secondModuleX},${secondModuleY}`);
    });
  });

  describe('SVG構造', () => {
    test('適切なSVG属性が設定される', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('version="1.1"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('preserveAspectRatio="xMinYMin meet"');
    });

    test('背景矩形が含まれる', () => {
      const modules = [[true]];
      const moduleSize = 1;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      expect(result).toContain('<rect width="100%" height="100%"');
      expect(result).toContain('cx="0" cy="0"');
    });

    test('有効なSVG形式で出力される', () => {
      const modules = [
        [true, false],
        [false, true]
      ];
      const moduleSize = 2;
      const settings = {
        margin: 1,
        moduleSize: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const result = renderer.render(modules, moduleSize, settings);

      // SVGが適切に開始・終了タグを持っているか確認
      expect(result.startsWith('<svg')).toBe(true);
      expect(result.endsWith('</svg>')).toBe(true);
      
      // XMLとして有効であることを簡易チェック
      expect(result).not.toContain('<<');
      expect(result).not.toContain('>>');
    });
  });
});