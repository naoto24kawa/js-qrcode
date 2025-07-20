# @elchika-inc/js-qrcode

[![npm version](https://badge.fury.io/js/@elchika-inc/js-qrcode.svg)](https://badge.fury.io/js/@elchika-inc/js-qrcode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Workers環境とSSRでの使用に最適化された純粋なJavaScriptのQRコードライブラリ。外部依存関係なしでQRコードの生成（SVG形式）と読み取り機能を提供します。

> 🇺🇸 **English README**: [README.md](./README.md)

## 特徴

- ✨ **Workers最適化**: Cloudflare Workers、Vercel Edge Runtime、Netlify Edge Functions対応
- 🚀 **高速**: 外部依存関係なしで軽量、コールドスタート最適化
- 📱 **SVG出力**: スケーラブルで軽量なQRコード生成
- 🔍 **読み取り機能**: 画像からのQRコード読み取り対応
- 🌐 **Universal**: SSR、SSG、ブラウザ環境で動作
- 🛡️ **TypeScript**: 完全な型定義ファイル付属
- 📦 **軽量**: 最小限のバンドルサイズ
- ✅ **高い互換性**: L・M・Qエラー訂正レベルで100%互換

## インストール

```bash
npm install @elchika-inc/js-qrcode
```

```bash
yarn add @elchika-inc/js-qrcode
```

```bash
pnpm add @elchika-inc/js-qrcode
```

## クイックスタート

### 基本的なQRコード生成

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// シンプルなQRコード生成
const svg = QRCode.generate('Hello World');
console.log(svg); // SVG形式の文字列

// カスタムオプションでの生成
const customSvg = QRCode.generate('https://example.com', {
  errorCorrectionLevel: 'M',
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### QRコード読み取り

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// ImageDataから読み取り
const result = await QRCode.decode(imageData);
console.log(result.data); // "デコードされたテキスト"

// Base64画像から読み取り
const base64Result = await QRCode.decode('data:image/png;base64,...');
```

## 使用例

### Cloudflare Workers

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text') || 'Hello World';
    
    const svg = QRCode.generate(text, { 
      errorCorrectionLevel: 'M',
      margin: 4 
    });
    
    return new Response(svg, {
      headers: { 
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }
};
```

### Next.js App Router API

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  
  if (!data) {
    return Response.json({ error: 'データが必要です' }, { status: 400 });
  }
  
  try {
    const svg = QRCode.generate(data, {
      errorCorrectionLevel: 'M'
    });
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Vercel Edge Runtime

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  const svg = QRCode.generate(text);
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
```

### ブラウザ環境でのカメラスキャン

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// カメラアクセスが可能な環境でのみ使用
const scanner = new QRCode.Scanner(videoElement);

try {
  await scanner.start();
  scanner.on('decode', (result) => {
    console.log('スキャン結果:', result.data);
  });
} catch (error) {
  console.error('カメラアクセスエラー:', error);
}
```

## API リファレンス

### QRCode.generate(data, options)

QRコードのSVGを生成します。

#### パラメーター

- `data` (string): エンコードするデータ
- `options` (object, optional): 生成オプション
  - `errorCorrectionLevel` (string): エラー訂正レベル ('L', 'M', 'Q', 'H')。デフォルト: 'M'
  - `margin` (number): 余白のサイズ。デフォルト: 4
  - `color` (object): 色設定
    - `dark` (string): 暗色部分の色。デフォルト: '#000000'
    - `light` (string): 明色部分の色。デフォルト: '#FFFFFF'
  - `forceMask` (number, optional): 特定のマスクパターンを強制指定 (0-7)

#### 戻り値

SVG形式の文字列

### QRCode.decode(data, options)

画像からQRコードを読み取ります。

#### パラメーター

- `data` (ImageData | string | Uint8Array): 画像データ
- `options` (object, optional): デコードオプション

#### 戻り値

Promise<object> - `data`プロパティを含むデコード結果

## エラー訂正レベル

| レベル | エラー復旧率 | 互換性 | 推奨用途 |
|--------|-------------|--------|----------|
| L      | 約7%        | ✅ 100% | きれいな環境 |
| M      | 約15%       | ✅ 100% | **デフォルト** - 一般用途 |
| Q      | 約25%       | ✅ 100% | ノイズの多い環境 |
| H      | 約30%       | ⚠️ 制限あり | **利用可能だが一部リーダーで失敗する場合あり** |

> **Hレベルについての注記**: H（高）エラー訂正レベルはAPIで利用可能ですが、互換性の制限により一部のQRコードリーダーで読み取りに失敗する場合があります。最大の互換性を得るには、L、M、またはQレベルの使用を推奨します。

## エラーハンドリング

```javascript
import QRCode from '@elchika-inc/js-qrcode';

try {
  const svg = QRCode.generate('最大容量を超える非常に長いテキスト...');
} catch (error) {
  if (error instanceof QRCode.errors.QRCodeGenerationError) {
    console.log('生成エラー:', error.code, error.message);
  }
}
```

利用可能なエラータイプ：
- `QRCodeGenerationError`: QRコード生成時のエラー
- `QRCodeDecodeError`: QRコード読み取り時のエラー
- `CameraAccessError`: カメラアクセス時のエラー
- `EnvironmentError`: 環境関連のエラー

## 対応環境

- **Edge Runtime**: Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- **Node.js**: 18.0.0以上
- **ブラウザ**: モダンブラウザ（ES2020対応）
- **TypeScript**: 4.5以上

## 開発

### ローカル開発

```bash
# 依存関係のインストール
npm install

# ライブラリのビルド
npm run build

# テスト実行
npm test

# ローカルデモサーバー起動
npx serve . # または python -m http.server
# http://localhost:3000/index.html を開く
```

### プロジェクト構造

```
js-qrcode/
├── src/           # ライブラリソースコード
├── dist/          # ビルドファイル
├── tests/         # テストスイート
├── index.html     # デモページ
└── README.md      # このファイル
```

## 貢献

Issue報告やプルリクエストをお待ちしております。

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## リンク

- [GitHub リポジトリ](https://github.com/elchika-inc/workers-qrcode)
- [npm パッケージ](https://www.npmjs.com/package/@elchika-inc/js-qrcode)
- [バグ報告](https://github.com/elchika-inc/workers-qrcode/issues)