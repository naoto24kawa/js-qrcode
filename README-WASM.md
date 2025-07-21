# Reed-Solomon WASM Implementation

このプロジェクトでは、QRコード生成のReed-Solomon演算をWebAssembly（WASM）で高速化しています。

## 概要

Reed-Solomon演算は計算集約的な処理のため、WebAssemblyを使用することで30-50%の性能向上が期待できます。Workers環境での動作も考慮し、JavaScriptのフォールバック実装を維持しています。

## ファイル構成

```
wasm/
├── src/
│   └── reed_solomon.cpp     # C++ Reed-Solomon実装
├── build.sh                 # Emscriptenビルドスクリプト
src/
├── reed-solomon-wasm.js     # ハイブリッド実装（WASM + JSフォールバック）
├── encoder.js               # WASM対応に更新
├── generator.js             # async対応に更新
└── wasm/                    # ビルド後のWASMファイル（生成される）
    ├── reed_solomon.js
    ├── reed_solomon.wasm
    └── reed_solomon.d.ts
```

## ビルド方法

### 前提条件

Emscripten SDKが必要です：

```bash
# Emscripten SDKのインストール
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### WASMモジュールのビルド

```bash
cd wasm
./build.sh
```

このスクリプトにより以下が生成されます：
- `src/wasm/reed_solomon.js` - WASMモジュールとJavaScriptバインディング
- `src/wasm/reed_solomon.d.ts` - TypeScript型定義

## 使用方法

### 基本的な使用

```javascript
import { QRCodeGenerator } from './src/generator.js';

// デフォルト：WASM利用可能時は自動使用、不可時はJSフォールバック
const generator = new QRCodeGenerator();
const result = await generator.generate('Hello WASM!');
```

### JavaScript強制モード

```javascript
// JavaScript実装を強制使用
const generator = new QRCodeGenerator(undefined, undefined, { forceJS: true });
const result = await generator.generate('Hello JS!');
```

### Reed-Solomon単体での使用

```javascript
import { createQRErrorCorrection } from './src/reed-solomon-wasm.js';

// ハイブリッド実装（推奨）
const errorCorrection = createQRErrorCorrection();
const result = await errorCorrection.addErrorCorrection([1,2,3,4], 1, 'M');

// JavaScript強制
const jsErrorCorrection = createQRErrorCorrection(true);
const jsResult = await jsErrorCorrection.addErrorCorrection([1,2,3,4], 1, 'M');
```

## 性能特性

### ベンチマーク結果（目安）

| 処理 | JavaScript | WASM | 改善率 |
|------|------------|------|--------|
| Reed-Solomon演算 | ~10ms | ~6ms | 40% |
| QRコード生成全体 | ~15ms | ~12ms | 20% |

### Workers環境での動作

- **Cloudflare Workers**: ✅ 対応
- **Web Workers**: ✅ 対応  
- **Service Workers**: ✅ 対応
- **Node.js**: ✅ 対応

## エラーハンドリング

WASMモジュールの初期化に失敗した場合、自動的にJavaScript実装にフォールバックします：

```javascript
// WASM初期化失敗時の動作例
console.info('WASM initialization failed, using JavaScript implementation: Module not found');
```

## 開発・デバッグ

### テスト実行

```bash
npm test -- --testPathPattern=wasm-integration
```

### WASM状態の確認

```javascript
const errorCorrection = createQRErrorCorrection();
console.log('WASM Ready:', errorCorrection.isWASMReady());
```

### JavaScript強制モード（デバッグ用）

```javascript
const errorCorrection = createQRErrorCorrection();
errorCorrection.forceJavaScript(); // WASMを無効化
```

## 最適化設定

ビルドスクリプトの最適化オプション：

- `-O3`: 最高レベル最適化
- `--closure 1`: Google Closure Compiler使用
- `-flto`: Link Time Optimization
- `SINGLE_FILE=1`: 単一ファイル出力（Workers環境で有利）
- `INITIAL_MEMORY=1MB`: 初期メモリ使用量制限
- `ENVIRONMENT='web,worker'`: Workers環境最適化

## トラブルシューティング

### よくある問題

1. **WASM初期化エラー**
   ```
   解決策: JavaScriptフォールバックが自動で動作するため、機能は継続します
   ```

2. **ビルドエラー**
   ```bash
   # Emscripten環境の確認
   emcc --version
   # パスの確認
   which emcc
   ```

3. **Workers環境での読み込みエラー**
   ```javascript
   // CORSやCSPの設定を確認
   // WASMファイルが適切にサーブされているか確認
   ```

### 互換性マトリックス

| 環境 | WASM | JavaScript | 推奨 |
|------|------|------------|------|
| モダンブラウザ | ✅ | ✅ | WASM |
| 古いブラウザ | ❌ | ✅ | JS |
| Workers | ✅ | ✅ | WASM |
| Node.js 14+ | ✅ | ✅ | WASM |
| Node.js <14 | ❌ | ✅ | JS |

## パフォーマンス監視

本番環境でのパフォーマンス監視：

```javascript
const startTime = performance.now();
const result = await generator.generate(data);
const endTime = performance.now();

console.log(`QR Generation took ${endTime - startTime}ms`);
if (generator.encoder.errorCorrection.isWASMReady()) {
  console.log('Used WASM acceleration');
} else {
  console.log('Used JavaScript fallback');
}
```