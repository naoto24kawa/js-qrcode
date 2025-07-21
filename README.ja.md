# @elchika-inc/js-qrcode

[![npm version](https://badge.fury.io/js/@elchika-inc/js-qrcode.svg)](https://badge.fury.io/js/@elchika-inc/js-qrcode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Workers環境とSSRでの使用に最適化された純粋なJavaScriptのQRコードライブラリ。外部依存関係なしでQRコードの生成（SVG形式）と読み取り機能を提供し、高度なエラーハンドリングと分析機能を搭載しています。

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
- 🔧 **高度なエラーハンドリング**: カスタムハンドラーと分析機能付きの構造化エラー情報
- 📊 **エラー分析**: リアルタイムエラー追跡、分類、レポート機能
- 🎯 **エラールーティング**: インテリジェントなエラー分類と自動回復提案

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

### 高度なエラーハンドリング

```javascript
import QRCode from '@elchika-inc/js-qrcode';

// 基本的な使用方法（後方互換）
const svg = QRCode.generate('Hello World');

// 分析機能付きの高度な使用方法
const svgWithAnalytics = await QRCode.generateWithAnalytics('Hello World', {
  errorCorrectionLevel: 'M',
  margin: 4
});

// カスタムエラーハンドリング
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  console.log('データが長すぎます:', context.input.dataLength);
  console.log('提案:', error.suggestions);
  return error;
});

// グローバルエラーハンドラー
QRCode.onAllErrors((error, context) => {
  console.log('エラーが発生しました:', error.code);
  // 監視サービスに送信
  sendToMonitoring(error.toJSON());
  return error;
});

// エラー分析
const stats = QRCode.getErrorStats();
console.log('総エラー数:', stats.total);
console.log('エラーパターン:', stats.patterns);
```

## 使用例

### Cloudflare Workers（エラーハンドリング付き）

```javascript
import QRCode from '@elchika-inc/js-qrcode';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const text = url.searchParams.get('text') || 'Hello World';
    
    try {
      // より良いエラー追跡のために分析版を使用
      const svg = await QRCode.generateWithAnalytics(text, { 
        errorCorrectionLevel: 'M',
        margin: 4 
      });
      
      return new Response(svg, {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch (error) {
      // 監視用にエラー統計をログ出力
      const stats = QRCode.getErrorStats();
      console.log('エラー統計:', stats);
      
      return new Response(JSON.stringify({
        error: error.getUserMessage ? error.getUserMessage() : error.message,
        code: error.code,
        suggestions: error.suggestions
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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

### コア生成メソッド

#### QRCode.generate(data, options)

基本的なQRコード生成（同期的、後方互換）。

**パラメーター:**
- `data` (string): エンコードするデータ
- `options` (object, optional): 生成オプション
  - `errorCorrectionLevel` (string): エラー訂正レベル ('L', 'M', 'Q', 'H')。デフォルト: 'M'
  - `margin` (number): 余白のサイズ。デフォルト: 4
  - `color` (object): 色設定
    - `dark` (string): 暗色部分の色。デフォルト: '#000000'
    - `light` (string): 明色部分の色。デフォルト: '#FFFFFF'
  - `forceMask` (number, optional): 特定のマスクパターンを強制指定 (0-7)
  - `returnObject` (boolean): SVG文字列の代わりに詳細オブジェクトを返す。デフォルト: false

**戻り値:** SVG形式の文字列（`returnObject: true`の場合はオブジェクト）

#### QRCode.generateWithAnalytics(data, options)

エラー分析とハンドリング付きの高度なQRコード生成（非同期）。

**パラメーター:** `generate()`メソッドと同じ

**戻り値:** Promise<string> - SVG形式の文字列（`returnObject: true`の場合はオブジェクト）

### コア読み取りメソッド

#### QRCode.decode(data, options)

基本的なQRコード読み取り。

**パラメーター:**
- `data` (ImageData | string | Uint8Array): 画像データ
- `options` (object, optional): デコードオプション

**戻り値:** Promise<object> - `data`プロパティを含むデコード結果

#### QRCode.decodeWithAnalytics(data, options)

エラー分析付きの高度なQRコード読み取り。

**パラメーター:** `decode()`メソッドと同じ

**戻り値:** Promise<object> - 拡張エラーコンテキスト付きのデコード結果

### エラーハンドリングAPI

#### QRCode.onError(errorCodeOrType, handler)

特定のエラーコードまたはタイプに対するカスタムエラーハンドラーを登録。

```javascript
// 特定のエラーコードを処理
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  console.log('データ長:', context.input.dataLength);
  return error;
});

// エラータイプを処理
QRCode.onError(QRCode.errors.QRCodeGenerationError, (error, context) => {
  console.log('生成エラー:', error.code);
  return error;
});
```

#### QRCode.onAllErrors(handler)

グローバルエラーハンドラー（フォールバック）を登録。

```javascript
QRCode.onAllErrors((error, context) => {
  console.log('未処理エラー:', error.code);
  return error;
});
```

#### QRCode.useErrorMiddleware(middleware)

エラー処理ミドルウェアを追加。

```javascript
QRCode.useErrorMiddleware((error, context) => {
  // 外部サービスにログ出力
  logger.error(error.toJSON());
  return error;
});
```

### エラー分析API

#### QRCode.getErrorStats()

エラー統計と分析を取得。

**戻り値:**
```javascript
{
  total: number,
  byType: { [errorType]: count },
  byCode: { [errorCode]: count },
  patterns: Array<[pattern, count]>,
  recentErrors: Array<ErrorSummary>
}
```

#### QRCode.clearErrorHistory()

すべてのエラー履歴と統計をクリア。

#### QRCode.classifyError(error)

エラーの重要度、カテゴリ、回復可能性による分類。

**戻り値:**
```javascript
{
  severity: 'low' | 'medium' | 'high' | 'critical',
  category: 'generation' | 'decode' | 'camera' | 'environment' | 'validation',
  recoverable: boolean,
  userFacing: boolean,
  retryable: boolean
}
```

### エラールーティングAPI

#### QRCode.addErrorRoute(criteria, handler)

カスタムエラールーティングルールを追加。

```javascript
QRCode.addErrorRoute({ severity: 'high' }, (error, context) => {
  // 監視システムにアラート送信
  alertSystem.notify(error);
  return error;
});

QRCode.addErrorRoute({ recoverable: true }, (error, context) => {
  // 回復提案を提供
  error.suggestions = generateRecoverySuggestions(error);
  return error;
});
```

#### QRCode.addSeverityRule(errorCode, severity)

カスタム重要度分類ルールを追加。

```javascript
QRCode.addSeverityRule('CUSTOM_ERROR', 'critical');
```

### エラーファクトリーAPI

#### QRCode.createError(type, code, message, details, context)

カスタム構造化エラーを作成。

```javascript
const customError = QRCode.createError(
  'generation',
  'CUSTOM_ERROR',
  'カスタムエラーが発生しました',
  { customField: 'value' },
  new QRCode.errors.ErrorContext().withOperation('custom')
);
```

## エラー訂正レベル

| レベル | エラー復旧率 | 互換性 | 推奨用途 |
|--------|-------------|--------|----------|
| L      | 約7%        | ✅ 100% | きれいな環境 |
| M      | 約15%       | ✅ 100% | **デフォルト** - 一般用途 |
| Q      | 約25%       | ✅ 100% | ノイズの多い環境 |
| H      | 約30%       | ⚠️ 制限あり | **利用可能だが一部リーダーで失敗する場合あり** |

> **Hレベルについての注記**: H（高）エラー訂正レベルはAPIで利用可能ですが、互換性の制限により一部のQRコードリーダーで読み取りに失敗する場合があります。最大の互換性を得るには、L、M、またはQレベルの使用を推奨します。

## 高度なエラーハンドリング機能

### エラータイプとコード

ライブラリは詳細なコンテキスト付きの構造化エラー情報を提供します：

```javascript
import QRCode from '@elchika-inc/js-qrcode';

try {
  const svg = QRCode.generate('最大容量を超える非常に長いテキスト...');
} catch (error) {
  if (error instanceof QRCode.errors.QRCodeGenerationError) {
    console.log('エラーコード:', error.code);
    console.log('ユーザー向けメッセージ:', error.getUserMessage());
    console.log('技術的詳細:', error.details);
    console.log('タイムスタンプ:', error.timestamp);
    console.log('コンテキスト:', error.details.context);
  }
}
```

**利用可能なエラータイプ:**
- `QRCodeGenerationError`: QRコード生成時のエラー
  - `INVALID_DATA`, `DATA_TOO_LONG`, `INVALID_OPTIONS`, `ENCODING_FAILED`, `RENDERING_FAILED`
- `QRCodeDecodeError`: QRコード読み取り時のエラー
  - `INVALID_IMAGE`, `NO_QR_FOUND`, `FINDER_PATTERN_NOT_FOUND`, `FORMAT_INFO_ERROR`, `DATA_DECODE_ERROR`
- `CameraAccessError`: カメラアクセス時のエラー
  - `PERMISSION_DENIED`, `DEVICE_NOT_FOUND`, `NOT_SUPPORTED`, `HARDWARE_ERROR`
- `EnvironmentError`: 環境関連のエラー
  - `UNSUPPORTED_BROWSER`, `MISSING_DEPENDENCIES`, `SECURITY_RESTRICTION`
- `ValidationError`: 入力バリデーションエラー
  - `INVALID_PARAMETER`, `MISSING_REQUIRED_FIELD`, `TYPE_MISMATCH`, `VALUE_OUT_OF_RANGE`

### 本番環境でのエラー監視

```javascript
// 本番環境用エラー監視の設定
QRCode.onAllErrors((error, context) => {
  // 監視サービス（例：Sentry、DataDog）に送信
  monitoringService.captureException(error, {
    tags: {
      operation: context.operation,
      errorCode: error.code,
      severity: error.classification?.severity
    },
    extra: {
      context: context,
      userAgent: context.environment?.userAgent,
      inputLength: context.input?.dataLength
    }
  });
  
  return error;
});

// 高重要度エラーの特別処理
QRCode.addErrorRoute({ severity: 'critical' }, (error, context) => {
  // クリティカルエラーの即座アラート
  alerting.sendPagerDutyAlert({
    message: `クリティカルQRコードエラー: ${error.code}`,
    details: error.toJSON()
  });
  
  return error;
});
```

### エラー回復パターン

```javascript
// フォールバックオプション付き自動リトライ
async function generateQRWithRetry(data, options = {}) {
  const fallbackOptions = [
    { ...options, errorCorrectionLevel: 'L' },
    { ...options, errorCorrectionLevel: 'M' },
    { ...options, errorCorrectionLevel: 'Q' }
  ];
  
  for (const opts of fallbackOptions) {
    try {
      return await QRCode.generateWithAnalytics(data, opts);
    } catch (error) {
      if (error.code === 'DATA_TOO_LONG' && opts !== fallbackOptions[fallbackOptions.length - 1]) {
        console.log(`${opts.errorCorrectionLevel} レベルでリトライ中...`);
        continue;
      }
      throw error;
    }
  }
}

// ユーザーフレンドリーなエラーメッセージ
QRCode.onError('DATA_TOO_LONG', (error, context) => {
  error.userFriendlyMessage = `テキストが長すぎます（${context.input.dataLength}文字）。2900文字未満に短縮してください。`;
  error.suggestions = [
    '不要なテキストを削除する',
    'リンクにはURL短縮サービスを使用する',
    '複数のQRコードに分割する'
  ];
  return error;
});
```

## 対応環境

- **Edge Runtime**: Cloudflare Workers, Vercel Edge Runtime, Netlify Edge Functions
- **Node.js**: 18.0.0以上
- **ブラウザ**: モダンブラウザ（ES2020対応）
- **TypeScript**: 4.5以上

## 使用例とデモ

リポジトリには包括的な使用例が用意されています：

- **基本的な使用方法**: `examples/error-handling-examples.js`
- **本番環境設定**: `examples/production-monitoring.js`
- **Workers統合**: `examples/workers-examples.js`
- **インタラクティブデモ**: `index.html`（ローカルサーバーで実行）

## 開発

### ローカル開発

```bash
# 依存関係のインストール
npm install

# ライブラリのビルド
npm run build

# テスト実行
npm test

# エラーハンドリングのテストを個別実行
npm test tests/unit/error-handling.test.js

# ローカルデモサーバー起動
npx serve . # または python -m http.server
# http://localhost:3000/index.html を開く
```

### プロジェクト構造

```
js-qrcode/
├── src/                          # ライブラリソースコード
│   ├── index.js                  # メインAPI
│   ├── errors.js                 # エラーハンドリングシステム
│   ├── error-router.js           # エラー分類とルーティング
│   ├── generator.js              # QRコード生成
│   ├── decoder.js                # QRコード読み取り
│   └── renderers/                # 出力形式レンダラー
├── examples/                     # 使用例
│   └── error-handling-examples.js
├── tests/                        # テストスイート
│   ├── unit/                     # ユニットテスト
│   └── integration/              # 統合テスト
├── dist/                         # ビルドファイル
├── index.html                    # インタラクティブデモ
└── README.md                     # このファイル
```

### エラーハンドリングのテスト

```bash
# 包括的なエラーハンドリングテストを実行
node examples/error-handling-examples.js

# 基本機能のテスト
node test-error-handling.js

# 特定のテストスイートを実行
npm test -- --testNamePattern="Error"
```

## 移行ガイド

### v1.x から v2.x へ（エラーハンドリング更新）

コアAPIは後方互換性を維持しています。新機能は追加的なものです：

```javascript
// v1.x のコードはそのまま動作
const svg = QRCode.generate('Hello World');

// v2.x で新機能を追加
const svgWithAnalytics = await QRCode.generateWithAnalytics('Hello World');

// 新しいエラーハンドリング機能
QRCode.onError('DATA_TOO_LONG', handler);
const stats = QRCode.getErrorStats();
```

### パフォーマンス考慮事項

- **基本メソッド**（`generate`, `decode`）: 最小限のオーバーヘッド、v1.x と同じパフォーマンス
- **分析メソッド**（`generateWithAnalytics`, `decodeWithAnalytics`）: コンテキスト構築とエラー追跡による小さなオーバーヘッド
- **エラーハンドラー**: エラー発生時のみ実行
- **メモリ使用量**: エラー履歴は1000エントリに制限され、自動クリーンアップあり

## 貢献

コントリビューションを歓迎します！以下のガイドラインをご確認ください：

1. **バグ報告**: 詳細な再現手順と共にGitHub Issuesを使用
2. **機能リクエスト**: 実装前にIssuesで議論
3. **プルリクエスト**: テストとドキュメント更新を含める
4. **エラーハンドリング**: 新しいエラータイプとコードは既存パターンに従う

### 開発環境のセットアップ

```bash
git clone https://github.com/elchika-inc/workers-qrcode.git
cd js-qrcode
npm install
npm run build
npm test
```

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## リンク

- [GitHub リポジトリ](https://github.com/elchika-inc/workers-qrcode)
- [npm パッケージ](https://www.npmjs.com/package/@elchika-inc/js-qrcode)
- [バグ報告](https://github.com/elchika-inc/workers-qrcode/issues)
- [使用例](./examples/)
- [インタラクティブデモ](./index.html)

## 変更履歴

### v2.0.0 - 高度なエラーハンドリング
- ✨ コンテキスト情報付き構造化エラーハンドリングを追加
- 📊 エラー分析と追跡機能を追加
- 🎯 エラー分類とインテリジェントルーティングを追加
- 🔧 カスタムエラーハンドラーとミドルウェアサポートを追加
- 📈 エラー統計と監視機能を追加
- 🔄 自動エラー回復提案を追加
- ⚡ 完全な後方互換性を維持
- 🧪 エラーハンドリングの包括的テストカバレッジを追加

### v1.x - 基本機能
- 初期のQRコード生成と読み取り
- Workers環境での最適化
- SVGとPNG出力形式
- 基本的なエラーハンドリング