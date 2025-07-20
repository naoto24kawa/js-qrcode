import QRCode from '../../src/index.js';

describe('QRコード生成・読み取り統合テスト', () => {
  describe('基本的なラウンドトリップテスト', () => {
    test('シンプルなテキストの生成と読み取り', async () => {
      const originalData = 'Hello, World!';
      
      // QRコード生成
      const qrSvg = QRCode.generate(originalData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
      
      // 注意: 実際の読み取りは画像処理が必要なため、
      // ここでは生成が成功したことを確認
      expect(typeof qrSvg).toBe('string');
      expect(qrSvg.length).toBeGreaterThan(100);
    });

    test('日本語テキストの生成', () => {
      const originalData = 'こんにちは世界！';
      
      const qrSvg = QRCode.generate(originalData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
      expect(typeof qrSvg).toBe('string');
    });

    test('数字データの生成', () => {
      const originalData = '1234567890';
      
      const qrSvg = QRCode.generate(originalData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('英数字データの生成', () => {
      const originalData = 'HELLO123';
      
      const qrSvg = QRCode.generate(originalData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });
  });

  describe('エラー訂正レベル別テスト', () => {
    const testData = 'Test data for error correction';

    test.each(['L', 'M', 'Q', 'H'])('エラー訂正レベル %s でQRコードが生成される', (level) => {
      const qrSvg = QRCode.generate(testData, {
        errorCorrectionLevel: level
      });
      
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
      expect(typeof qrSvg).toBe('string');
    });
  });

  describe('カスタムオプションでの生成テスト', () => {
    const testData = 'Custom options test';

    test('カスタム色設定でQRコードが生成される', () => {
      const qrSvg = QRCode.generate(testData, {
        color: {
          dark: '#ff0000',
          light: '#0000ff'
        }
      });
      
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('fill="#ff0000"');
      expect(qrSvg).toContain('fill="#0000ff"');
    });

    test('カスタムマージンでQRコードが生成される', () => {
      const qrSvg = QRCode.generate(testData, {
        margin: 8
      });
      
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('カスタムモジュールサイズでQRコードが生成される', () => {
      const qrSvg = QRCode.generate(testData, {
        moduleSize: 8
      });
      
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });
  });

  describe('長いデータでの生成テスト', () => {
    test('500文字のデータでQRコードが生成される', () => {
      const longData = 'A'.repeat(500);
      
      const qrSvg = QRCode.generate(longData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('1000文字のデータでQRコードが生成される', () => {
      const veryLongData = 'B'.repeat(1000);
      
      const qrSvg = QRCode.generate(veryLongData);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });
  });

  describe('URLとメールアドレスの生成テスト', () => {
    test('HTTPSのURLでQRコードが生成される', () => {
      const url = 'https://example.com/path?param=value&param2=value2';
      
      const qrSvg = QRCode.generate(url);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('メールアドレスでQRコードが生成される', () => {
      const email = 'mailto:test@example.com?subject=Hello&body=World';
      
      const qrSvg = QRCode.generate(email);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('電話番号でQRコードが生成される', () => {
      const phone = 'tel:+81-3-1234-5678';
      
      const qrSvg = QRCode.generate(phone);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });
  });

  describe('Wi-Fi設定QRコードの生成テスト', () => {
    test('WPA2-PSKのWi-Fi設定QRコードが生成される', () => {
      const wifiConfig = 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;';
      
      const qrSvg = QRCode.generate(wifiConfig);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });

    test('オープンWi-FiのQRコードが生成される', () => {
      const wifiConfig = 'WIFI:T:nopass;S:OpenNetwork;;';
      
      const qrSvg = QRCode.generate(wifiConfig);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('</svg>');
    });
  });

  describe('SVG構造の検証', () => {
    test('生成されたSVGが有効な構造を持つ', () => {
      const testData = 'Structure validation test';
      const qrSvg = QRCode.generate(testData);
      
      // 基本的なSVG構造の検証
      expect(qrSvg).toMatch(/<svg[^>]*>/);
      expect(qrSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(qrSvg).toContain('width=');
      expect(qrSvg).toContain('height=');
      expect(qrSvg).toContain('viewBox=');
      expect(qrSvg).toContain('</svg>');
      
      // 背景矩形の存在確認
      expect(qrSvg).toContain('<rect');
      expect(qrSvg).toContain('width="100%"');
      expect(qrSvg).toContain('height="100%"');
    });

    test('生成されたSVGにパスデータが含まれる', () => {
      const testData = 'Path data test';
      const qrSvg = QRCode.generate(testData);
      
      // パスデータの存在確認（QRコードの黒いモジュール）
      expect(qrSvg).toContain('<path');
      expect(qrSvg).toContain('d="');
      expect(qrSvg).toContain('fill=');
    });
  });

  describe('異なる設定での一貫性テスト', () => {
    test('同じデータで同じ設定なら同じ結果が生成される', () => {
      const testData = 'Consistency test data';
      const options = {
        errorCorrectionLevel: 'M',
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' }
      };
      
      const qrSvg1 = QRCode.generate(testData, options);
      const qrSvg2 = QRCode.generate(testData, options);
      
      expect(qrSvg1).toBe(qrSvg2);
    });

    test('異なるエラー訂正レベルでは異なる結果が生成される', () => {
      const testData = 'Different error correction test';
      
      const qrSvgL = QRCode.generate(testData, { errorCorrectionLevel: 'L' });
      const qrSvgH = QRCode.generate(testData, { errorCorrectionLevel: 'H' });
      
      expect(qrSvgL).not.toBe(qrSvgH);
    });

    test('異なる色設定では異なる結果が生成される', () => {
      const testData = 'Different color test';
      
      const qrSvgBlack = QRCode.generate(testData, {
        color: { dark: '#000000', light: '#ffffff' }
      });
      const qrSvgRed = QRCode.generate(testData, {
        color: { dark: '#ff0000', light: '#ffffff' }
      });
      
      expect(qrSvgBlack).not.toBe(qrSvgRed);
      expect(qrSvgRed).toContain('#ff0000');
    });
  });

  describe('エラーハンドリング', () => {
    test('空文字列でエラーが発生する', () => {
      expect(() => {
        QRCode.generate('');
      }).toThrow();
    });

    test('nullでエラーが発生する', () => {
      expect(() => {
        QRCode.generate(null);
      }).toThrow();
    });

    test('undefinedでエラーが発生する', () => {
      expect(() => {
        QRCode.generate(undefined);
      }).toThrow();
    });

    test('非常に長いデータでエラーが発生する', () => {
      const tooLongData = 'A'.repeat(3000); // MAX_DATA_LENGTHを超える
      
      expect(() => {
        QRCode.generate(tooLongData);
      }).toThrow();
    });
  });
});