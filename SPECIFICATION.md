# QRコードライブラリ仕様書

## 概要
純粋なJavaScriptのみで実装されたQRコードライブラリ。Workers環境とSSRでの使用に最適化されており、QRコードの生成（SVG形式）と読み取り機能を提供する。

## パッケージ情報
- **パッケージ名**: `@elchika-inc/js-qrcode`
- **バージョン**: 1.0.0
- **ライセンス**: MIT
- **対応環境**: 
  - **Cloudflare Workers**（メイン対象）
  - **Vercel Edge Runtime**
  - **Netlify Edge Functions**  
  - **Deno Deploy**
  - **Next.js SSR/SSG**
  - **Nuxt.js SSR/SSG**
  - その他のエッジランタイム・SSR環境
- **依存関係**: なし（純粋なJavaScriptのみ）

## 主要機能

### 1. QRコード生成機能（Workers/SSR最適化）
- **SVG形式**でQRコードを生成（軽量、スケーラブル）
- **エッジランタイム**でのレスポンス時間最適化
- **SSR時の動的生成**に対応
- メモリ使用量を最小限に抑制
- 外部依存関係なし

### 2. QRコード読み取り機能
#### Workers/SSR対応機能
- **ImageData**からの読み取り（Workers環境）
- **Base64エンコード画像**からの読み取り
- **バイナリデータ**（Uint8Array）からの読み取り
- **URLからの画像取得**と読み取り（エッジ環境）

#### クライアントサイド補助機能
- HTMLImageElement/HTMLCanvasElementからの読み取り
- ファイルアップロードからの読み取り
- WebカメラAPIとの連携（ブラウザ環境のみ）

## API仕様

### QRコード生成

#### `QRCode.generate(data, options)`
QRコードをSVG形式で生成する。

**パラメータ:**
- `data` (string): エンコードするデータ
- `options` (object, optional): 生成オプション
  - `size` (number): QRコードのサイズ（デフォルト: 200）
  - `margin` (number): マージン（デフォルト: 4）
  - `errorCorrectionLevel` (string): エラー訂正レベル（'L', 'M', 'Q', 'H'）（デフォルト: 'M'）
  - `color` (object): カラー設定
    - `dark` (string): ダークモジュールの色（デフォルト: '#000000'）
    - `light` (string): ライトモジュールの色（デフォルト: '#FFFFFF'）

**戻り値:**
- `string`: SVG形式のQRコード

**使用例:**
```javascript
// Cloudflare Workers / Vercel Edge でのAPI応答
const qrSvg = QRCode.generate('https://example.com', {
  size: 250,
  margin: 5,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#333333',
    light: '#FFFFFF'
  }
});

// Response として返却
return new Response(qrSvg, {
  headers: { 'Content-Type': 'image/svg+xml' }
});
```

### QRコード読み取り

#### `QRCode.decode(data, options)` - 全環境対応
画像データからQRコードを読み取る。

**パラメータ:**
- `data` (ImageData|Uint8Array|string): 画像データ
  - `ImageData`: RGBA形式の画像データ
  - `Uint8Array`: バイナリ画像データ（RGBA形式）
  - `string`: Base64エンコード画像データ
- `options` (object, optional): デコードオプション
  - `width` (number): 画像幅（バイナリデータの場合必須）
  - `height` (number): 画像高（バイナリデータの場合必須）

**戻り値:**
- `Promise<string|null>`: デコードされたデータまたはnull

**使用例:**
```javascript
// Workers環境でのURL画像読み取り
const response = await fetch('https://example.com/qrcode.png');
const arrayBuffer = await response.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
const result = await QRCode.decode(uint8Array, { width: 640, height: 480 });

// Base64画像から読み取り（SSR環境）
const result = await QRCode.decode('data:image/png;base64,...');

// ImageDataから読み取り（Workers環境）
const result = await QRCode.decode(imageData);
```

#### `QRCode.Scanner` - クライアントサイド補助機能
QRコードスキャナークラス（ブラウザ環境での補助機能）

#### `new QRCode.Scanner(options)`
**パラメータ:**
- `options` (object, optional): スキャナーオプション
  - `video` (HTMLVideoElement): ビデオ要素
  - `canvas` (HTMLCanvasElement, optional): 描画用キャンバス
  - `continuous` (boolean): 連続スキャンモード（デフォルト: true）

#### `scanner.start()`
カメラを起動してスキャンを開始する。

**戻り値:**
- `Promise<void>`: カメラ起動完了時に解決

#### `scanner.stop()`
スキャンを停止する。

#### `scanner.scan()`
単一のスキャンを実行する。

**戻り値:**
- `Promise<string|null>`: デコードされたデータまたはnull

#### `scanner.scanImage(image)`
静止画像からQRコードを読み取る。

**パラメータ:**
- `image` (HTMLImageElement|HTMLCanvasElement|ImageData): スキャン対象の画像

**戻り値:**
- `Promise<string|null>`: デコードされたデータまたはnull

#### イベント
- `decode`: QRコードがデコードされた時に発生
  - `event.detail.data`: デコードされたデータ
- `error`: エラーが発生した時に発生
  - `event.detail.error`: エラーオブジェクト

**使用例:**
```javascript
// ブラウザ環境での補助機能（Workers連携）
const scanner = new QRCode.Scanner({
  video: document.getElementById('video'),
  continuous: true
});

scanner.addEventListener('decode', async (event) => {
  // Workers環境のAPIに送信
  const response = await fetch('/api/process-qr', {
    method: 'POST',
    body: JSON.stringify({ data: event.detail.data })
  });
});

await scanner.start();
```

## エラー処理

### エラータイプ
- `QRCodeGenerationError`: QRコード生成時のエラー
- `QRCodeDecodeError`: QRコード読み取り時のエラー
- `CameraAccessError`: カメラアクセス時のエラー（ブラウザ専用）
- `EnvironmentError`: 環境固有のエラー

### エラーコード
- `INVALID_DATA`: 無効なデータ
- `DATA_TOO_LONG`: データが長すぎる
- `UNSUPPORTED_FORMAT`: サポートされていない画像形式
- `CAMERA_NOT_FOUND`: カメラが見つからない（ブラウザ専用）
- `CAMERA_PERMISSION_DENIED`: カメラアクセスが拒否された（ブラウザ専用）
- `FEATURE_NOT_AVAILABLE`: 環境でサポートされていない機能
- `DECODE_FAILED`: デコードに失敗

## 環境別対応状況

### Workers/SSR環境（メイン対象）
#### Cloudflare Workers
- QRコード生成（高速レスポンス）
- 外部画像URLからの読み取り
- エッジキャッシング対応

#### Vercel Edge Runtime / Netlify Edge Functions
- SSG時のQRコード事前生成
- APIレスポンスでの動的生成
- 地域分散処理

#### SSRフレームワーク
- **Next.js**: API Routes、Edge Runtime対応
- **Nuxt.js**: Server API、Nitro対応
- **SvelteKit**: Server-side処理対応

### クライアントサイド（補助機能）
- カメラスキャン → Workers APIへの送信
- ファイルアップロード → Workers処理
- リアルタイム連携機能

### ブラウザ互換性（補助機能のみ）
- Chrome 60+（WebRTC対応）
- Firefox 60+（MediaDevices対応）
- Safari 11+（getUserMedia対応）
- Edge 79+（Chromium base）

## セキュリティ考慮事項

### Workers/SSR環境
- **外部URL取得時のCSRF保護**が必要
- **レート制限**の実装を推奨
- **入力データのサニタイズ**が必要
- **生成されたQRコードの内容検証**を推奨

### クライアントサイド
- カメラアクセスにはHTTPS接続が必要
- ユーザーの明示的な許可が必要
- **Workers APIとの通信暗号化**が必要

### 共通
- 読み取ったデータの検証は利用者側で実装する必要がある
- 環境固有の機能は実行時に検出・制限される

## パフォーマンス

### Workers/SSR環境
- **QRコード生成**: 平均5-30ms（エッジ最適化）
- **コールドスタート**: 50ms以下（Cloudflare Workers）
- **メモリ使用量**: 最大5MB（Workers制限内）
- **並行処理**: 複数リクエスト同時対応

### クライアントサイド
- **QRコード読み取り**: リアルタイムスキャン可能（30fps）
- **Workers API通信**: 平均100-300ms（地域による）

## 制限事項
- QRコードのバージョン1-40をサポート
- 数字、英数字、バイト、漢字モードをサポート
- 構造的連結モードは未サポート

## NPMパッケージ構成
```
js-qrcode/
├── package.json
├── README.md
├── LICENSE
├── SPECIFICATION.md
├── src/
│   ├── index.js
│   ├── generator.js
│   ├── scanner.js
│   ├── encoder.js
│   ├── decoder.js
│   └── utils.js
├── dist/
│   ├── js-qrcode.js
│   └── js-qrcode.min.js
└── examples/
    ├── generate.html
    └── scan.html
```

## インストール方法
```bash
npm install @elchika-inc/js-qrcode
```

## 使用方法

### ES Modules（Workers/SSR）
```javascript
import { QRCode } from '@elchika-inc/js-qrcode';

// Cloudflare Workers API
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text');
    
    // QRコード生成
    const svg = QRCode.generate(text, { size: 300 });
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
};

// Next.js API Route
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  
  const svg = QRCode.generate(data);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
```

### CommonJS（Node.js SSR）
```javascript
const { QRCode } = require('@elchika-inc/js-qrcode');

// Express.js での使用例
app.get('/qr', (req, res) => {
  const svg = QRCode.generate(req.query.text, {
    size: 250,
    errorCorrectionLevel: 'H'
  });
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Nuxt.js Server API
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const svg = QRCode.generate(query.text);
  
  setHeader(event, 'Content-Type', 'image/svg+xml');
  return svg;
});
```

### ブラウザ（クライアントサイド補助機能）
```html
<script src="https://unpkg.com/@elchika-inc/js-qrcode/dist/js-qrcode.min.js"></script>
<script>
// Workers APIと連携
async function generateQR(text) {
  const response = await fetch(`/api/qr?text=${encodeURIComponent(text)}`);
  const svg = await response.text();
  document.getElementById('qr-container').innerHTML = svg;
}

// カメラスキャン結果をWorkers APIに送信
const scanner = new QRCode.Scanner({ video });
scanner.addEventListener('decode', async (event) => {
  await fetch('/api/process-qr', {
    method: 'POST',
    body: JSON.stringify({ data: event.detail.data })
  });
});
</script>
```

### Workers環境（詳細例）
```javascript
// Cloudflare Workers - QR生成API
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/generate') {
      const text = url.searchParams.get('text');
      const svg = QRCode.generate(text, { size: 300 });
      
      return new Response(svg, {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    if (url.pathname === '/decode') {
      const imageUrl = url.searchParams.get('image');
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      
      const result = await QRCode.decode(new Uint8Array(buffer));
      return Response.json({ data: result });
    }
  }
};

// Vercel Edge Runtime
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  
  const svg = QRCode.generate(data, {
    errorCorrectionLevel: 'H',
    margin: 4
  });
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
```

## 開発者向け情報

### ビルド
```bash
npm run build
```

### テスト
```bash
npm test
```

### リリース
```bash
npm version <major|minor|patch>
npm publish
```