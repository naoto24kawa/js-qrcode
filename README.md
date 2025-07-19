# @elchika-inc/js-qrcode

純粋なJavaScriptのみで実装されたQRコードライブラリ。Workers環境とSSRでの使用に最適化されており、QRコードの生成（SVG形式）と読み取り機能を提供します。

## 特徴

- ✨ **Workers最適化**: Cloudflare Workers、Vercel Edge Runtime、Netlify Edge Functions対応
- 🚀 **高速**: 外部依存関係なしで軽量
- 📱 **SVG出力**: スケーラブルで軽量なQRコード生成
- 🔍 **読み取り機能**: 画像からのQRコード読み取り
- 🌐 **Universal**: SSR、SSG、ブラウザで動作
- 🛡️ **TypeScript**: 型定義ファイル付属

## インストール

```bash
npm install @elchika-inc/js-qrcode
```

## 使用方法

### QRコード生成（Workers/SSR）

```javascript
import { QRCode } from '@elchika-inc/js-qrcode';

// 基本的な使用方法
const svg = QRCode.generate('https://example.com');

// オプション付き
const svg = QRCode.generate('Hello World', {
  size: 300,
  margin: 4,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### Cloudflare Workers

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text');
    
    const svg = QRCode.generate(text, { size: 300 });
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
};
```

### Next.js API Route

```javascript
import { QRCode } from '@elchika-inc/js-qrcode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  
  const svg = QRCode.generate(data);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}
```

## API リファレンス

詳細なAPI仕様については、[SPECIFICATION.md](./SPECIFICATION.md)をご覧ください。

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルをご覧ください。