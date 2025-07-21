# WASM Build Scripts Guide

このドキュメントでは、package.jsonに追加されたWASMビルドスクリプトの使用方法を説明します。

## 🚀 Quick Start

### Emscripten環境のセットアップ

```bash
# 1. Emscripten SDK をインストール（初回のみ）
npm run wasm:setup

# 2. 環境変数を有効化（セッションごとに必要）
source ~/emsdk/emsdk_env.sh

# 3. Emscripten環境の確認
npm run wasm:check
```

### WASMモジュールのビルド

```bash
# 全WASMモジュール（Reed-Solomon + Masking + Data Encoding）
npm run wasm:build

# 個別モジュールビルド
npm run wasm:build:reed-solomon    # Reed-Solomon エラー訂正
npm run wasm:build:masking         # マスクパターン評価
npm run wasm:build:data-encoder    # データエンコーディング
```

### テストとベンチマーク

```bash
# WASM統合テスト
npm run wasm:test

# 個別テスト
npm run wasm:test:reed-solomon
npm run wasm:test:masking
npm run wasm:test:data-encoder

# 性能ベンチマーク
npm run wasm:benchmark
```

## 📋 Available Scripts

### セットアップ・環境確認

| Script | Description |
|--------|-------------|
| `wasm:setup` | Emscripten SDKをホームディレクトリにインストール |
| `wasm:check` | Emscripten環境の確認（emccコマンドの存在チェック） |

### ビルド

| Script | Description |
|--------|-------------|
| `wasm:build` | 全WASMモジュールをビルド |
| `wasm:build:reed-solomon` | Reed-Solomonモジュールのみビルド |
| `wasm:build:masking` | Maskingモジュールのみビルド |
| `wasm:build:data-encoder` | Data Encodingモジュールのみビルド |
| `wasm:clean` | 生成されたWASMファイルを削除 |

### テスト・ベンチマーク

| Script | Description |
|--------|-------------|
| `wasm:test` | 全WASMモジュールの統合テスト |
| `wasm:test:reed-solomon` | Reed-Solomon WASM統合テスト |
| `wasm:test:masking` | Masking WASM統合テスト |
| `wasm:test:data-encoder` | Data Encoding WASM統合テスト |
| `wasm:benchmark` | WASM vs JavaScript性能比較 |

## 🔧 使用例

### 初回セットアップ

```bash
# プロジェクトクローン後の初回セットアップ
npm install
npm run wasm:setup
source ~/emsdk/emsdk_env.sh
npm run wasm:build
npm run wasm:test
```

### 開発ワークフロー

```bash
# 開発開始時
source ~/emsdk/emsdk_env.sh

# Reed-Solomonの修正後
npm run wasm:build:reed-solomon
npm run wasm:test:reed-solomon

# 全体の動作確認
npm run wasm:benchmark
```

### CI/CD での使用

```bash
# CI環境での自動ビルド・テスト
npm ci
npm run wasm:setup
source ~/emsdk/emsdk_env.sh
npm run wasm:build
npm run test  # 通常テスト + WASMテスト
```

## 🛠️ トラブルシューティング

### よくある問題

#### 1. `emcc: command not found`

```bash
# 解決方法: Emscripten環境を有効化
source ~/emsdk/emsdk_env.sh
```

#### 2. `Error: Emscripten not found`

```bash
# 解決方法: Emscripten SDKをインストール
npm run wasm:setup
source ~/emsdk/emsdk_env.sh
```

#### 3. WASMファイルが見つからない

```bash
# 解決方法: WASMモジュールをビルド
npm run wasm:build
```

#### 4. テストが失敗する

```bash
# 解決方法: クリーン後に再ビルド
npm run wasm:clean
npm run wasm:build
npm run wasm:test
```

### パフォーマンス最適化

#### コンパイルオプション

WASMビルドでは以下の最適化を適用しています：

- `-O3`: 最高レベル最適化
- `--closure 1`: Google Closure Compiler
- `-flto`: Link Time Optimization
- `-s SINGLE_FILE=1`: Workers環境対応
- `-s ALLOW_MEMORY_GROWTH=1`: 動的メモリ管理

#### 性能測定のコツ

```bash
# 大きなデータでのベンチマーク
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const largeData = 'A'.repeat(200);  // 大きなデータ
  const iterations = 10;
  
  const wasmGen = new QRCodeGenerator();
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  
  console.time('WASM Total');
  for (let i = 0; i < iterations; i++) {
    await wasmGen.generate(largeData + i);
  }
  console.timeEnd('WASM Total');
  
  console.time('JS Total');
  for (let i = 0; i < iterations; i++) {
    await jsGen.generate(largeData + i);
  }
  console.timeEnd('JS Total');
});
"
```

## 🏗️ 開発者向け情報

### ファイル構成

```
wasm/
├── src/
│   ├── reed_solomon.cpp     # Reed-Solomon実装
│   ├── masking.cpp          # マスクパターン評価
│   └── data_encoder.cpp     # データエンコーディング
├── build.sh                 # ビルドスクリプト
src/wasm/                    # 生成ファイル（Git追跡対象）
├── reed_solomon.js          # Reed-Solomon WASMモジュール
├── masking.js               # Masking WASMモジュール
├── data_encoder.js          # Data Encoding WASMモジュール
├── reed_solomon.d.ts        # TypeScript型定義
├── masking.d.ts             # TypeScript型定義
└── data_encoder.d.ts        # TypeScript型定義
```

### カスタムビルド

```bash
# カスタムEmscriptenオプションでのビルド
cd wasm
source ~/emsdk/emsdk_env.sh

# 例: デバッグビルド
emcc src/reed_solomon.cpp -o ../src/wasm/reed_solomon_debug.js \
  -s WASM=1 -s MODULARIZE=1 --bind -O0 -g
```

### 新しいWASMモジュールの追加

1. `wasm/src/` に C++ファイルを追加
2. `wasm/build.sh` にビルド設定追加
3. `package.json` にスクリプト追加
4. JavaScript wrapper作成
5. テストファイル作成

## 🔗 関連リンク

- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [Reed-Solomon WASM 動作確認ガイド](VERIFICATION-REED-SOLOMON.md)
- [Masking WASM 動作確認ガイド](VERIFICATION-MASKING.md)
- [Data Encoding WASM 動作確認ガイド](VERIFICATION-DATA-ENCODING.md)

## 💡 Tips

### 環境変数の自動設定

`.bashrc` または `.zshrc` に追加すると便利：

```bash
# Emscripten環境の自動有効化
if [ -d "$HOME/emsdk" ]; then
  source "$HOME/emsdk/emsdk_env.sh" 2>/dev/null
fi
```

### 開発効率化

```bash
# エイリアス設定
alias wasm-dev='source ~/emsdk/emsdk_env.sh && npm run wasm:build && npm run wasm:test'
alias wasm-rs='source ~/emsdk/emsdk_env.sh && npm run wasm:build:reed-solomon'
```

これらのスクリプトにより、WASM開発が大幅に簡素化され、CI/CDパイプラインでの自動化も容易になります。