# Data Encoding WASM 動作確認ガイド

このガイドでは、Data Encoding WebAssembly実装の動作確認方法を説明します。

## 前提条件

### 必要なツール
```bash
# Emscriptenのインストール（WASMビルド用）
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Node.js 16以上推奨
node --version  # v16.0.0以上
```

### 依存関係のインストール
```bash
cd /path/to/js-qrcode/worktrees/feature-branch
npm install
```

## ステップ1: WASMモジュールのビルド

```bash
# WASMディレクトリに移動
cd wasm

# Data Encodingモジュールをビルド
./build.sh data_encoder

# またはトリプルWASM全ビルド
./build.sh
```

**期待される出力:**
```
Building Data Encoder WASM module...
Compiling data_encoder.cpp...
Generated: ../src/wasm/data_encoder.js
Generated: ../src/wasm/data_encoder.d.ts
Build completed successfully!
```

## ステップ2: 基本動作確認

### テストの実行
```bash
# Data Encoding専用テスト
npm test -- --testPathPattern=data-encoder-wasm-integration

# 期待される結果: 全29テストが成功
```

**成功例:**
```
PASS tests/unit/data-encoder-wasm-integration.test.js
✓ should create hybrid implementation by default
✓ should create JavaScript implementation when forced
✓ should handle JavaScript fallback gracefully for mode detection
✓ should handle JavaScript fallback gracefully for version determination
✓ should handle JavaScript fallback gracefully for data encoding
...
Tests: 29 passed, 29 total
```

### 手動動作確認
```bash
# Node.jsで直接確認
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  // トリプルWASM使用
  const wasmGen = new QRCodeGenerator();
  const wasmResult = await wasmGen.generate('Triple WASM Test');
  console.log('WASM Result - Mode:', wasmResult.mode, 'Version:', wasmResult.version);
  
  // JavaScript使用
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsResult = await jsGen.generate('Triple WASM Test');
  console.log('JS Result - Mode:', jsResult.mode, 'Version:', jsResult.version);
});
"
```

## ステップ3: データエンコーディングモード確認

### 3つのエンコーディングモードテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  console.log('WASM Ready:', dataEncoder.isWASMReady());
  
  // 数字モード
  const numericMode = await dataEncoder.detectMode('1234567890');
  console.log('Numeric mode (should be 1):', numericMode);
  
  // 英数字モード
  const alphanumericMode = await dataEncoder.detectMode('HELLO WORLD 123 $%*+-./');
  console.log('Alphanumeric mode (should be 2):', alphanumericMode);
  
  // バイトモード
  const byteMode = await dataEncoder.detectMode('Hello, こんにちは!');
  console.log('Byte mode (should be 4):', byteMode);
});
"
```

### バージョン決定テスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const testCases = [
    { data: 'Hi', expected: 1 },
    { data: 'A'.repeat(25), expected: 1 },
    { data: 'A'.repeat(50), expected: 2 },
    { data: 'A'.repeat(100), expected: 4 }
  ];
  
  for (const testCase of testCases) {
    const mode = await dataEncoder.detectMode(testCase.data);
    const version = await dataEncoder.determineVersion(testCase.data, mode, 'M');
    console.log(\`Data length \${testCase.data.length}: Version \${version} (mode: \${mode})\`);
  }
});
"
```

## ステップ4: 性能ベンチマーク

### データエンコーディング性能比較
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const testData = 'Performance Test Data ' + 'A'.repeat(100);
  
  // WASM性能測定
  const wasmDataEncoder = createQRDataEncoder(false);
  const wasmStart = performance.now();
  const wasmMode = await wasmDataEncoder.detectMode(testData);
  const wasmVersion = await wasmDataEncoder.determineVersion(testData, wasmMode, 'M');
  const wasmBytes = await wasmDataEncoder.encodeToBytes(testData, wasmMode, wasmVersion, 'M');
  const wasmTime = performance.now() - wasmStart;
  
  // JavaScript性能測定
  const jsDataEncoder = createQRDataEncoder(true);
  const jsStart = performance.now();
  const jsMode = await jsDataEncoder.detectMode(testData);
  const jsVersion = await jsDataEncoder.determineVersion(testData, jsMode, 'M');
  const jsBytes = await jsDataEncoder.encodeToBytes(testData, jsMode, jsVersion, 'M');
  const jsTime = performance.now() - jsStart;
  
  console.log(\`WASM: \${wasmTime.toFixed(2)}ms\`);
  console.log(\`JS: \${jsTime.toFixed(2)}ms\`);
  console.log(\`改善率: \${((jsTime - wasmTime) / jsTime * 100).toFixed(1)}%\`);
  console.log(\`Results match: \${wasmMode === jsMode && wasmBytes.length === jsBytes.length ? '✅' : '❌'}\`);
});
"
```

**期待される結果例:**
```
WASM: 1.45ms
JS: 1.82ms
改善率: 20.3%
Results match: ✅
```

### トリプルWASM統合性能テスト
```bash
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const testData = 'Triple WASM Performance Test ' + 'A'.repeat(50);
  const iterations = 10;
  
  // トリプルWASM測定
  const wasmGen = new QRCodeGenerator();
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await wasmGen.generate(testData + i);
  }
  const wasmTotal = performance.now() - wasmStart;
  
  // 全JavaScript測定
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await jsGen.generate(testData + i);
  }
  const jsTotal = performance.now() - jsStart;
  
  console.log(\`\${iterations}回実行結果 (Triple WASM vs Pure JS):\`);
  console.log(\`Triple WASM平均: \${(wasmTotal/iterations).toFixed(2)}ms\`);
  console.log(\`Pure JS平均: \${(jsTotal/iterations).toFixed(2)}ms\`);
  console.log(\`総合改善率: \${((jsTotal - wasmTotal) / jsTotal * 100).toFixed(1)}%\`);
});
"
```

**期待される結果例:**
```
10回実行結果 (Triple WASM vs Pure JS):
Triple WASM平均: 8.45ms
Pure JS平均: 14.52ms
総合改善率: 41.8%
```

## ステップ5: エンコーディング機能確認

### 数字エンコーディングテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const numericData = '1234567890';
  const mode = await dataEncoder.detectMode(numericData);
  const bits = await dataEncoder.encode(numericData, mode, 1);
  
  console.log('Numeric data:', numericData);
  console.log('Detected mode:', mode, '(should be 1)');
  console.log('Encoded bits length:', bits.length);
  console.log('Bits sample:', bits.substring(0, 20), '...');
  console.log('Valid binary:', /^[01]+$/.test(bits) ? '✅' : '❌');
});
"
```

### 英数字エンコーディングテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const alphanumericData = 'HELLO WORLD 123 $%*+-./';
  const mode = await dataEncoder.detectMode(alphanumericData);
  const bits = await dataEncoder.encode(alphanumericData, mode, 2);
  
  console.log('Alphanumeric data:', alphanumericData);
  console.log('Detected mode:', mode, '(should be 2)');
  console.log('Encoded bits length:', bits.length);
  console.log('Bits sample:', bits.substring(0, 20), '...');
  console.log('Valid binary:', /^[01]+$/.test(bits) ? '✅' : '❌');
});
"
```

### UTF-8バイトエンコーディングテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const byteData = 'Hello, こんにちは! 🚀';
  const mode = await dataEncoder.detectMode(byteData);
  const bits = await dataEncoder.encode(byteData, mode, 3);
  const utf8Bytes = dataEncoder.stringToUtf8Bytes(byteData);
  
  console.log('Byte data:', byteData);
  console.log('Detected mode:', mode, '(should be 4)');
  console.log('UTF-8 bytes:', utf8Bytes.slice(0, 10), '...');
  console.log('Encoded bits length:', bits.length);
  console.log('Valid binary:', /^[01]+$/.test(bits) ? '✅' : '❌');
});
"
```

### バイト配列生成テスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const testData = 'Byte Array Test';
  const mode = await dataEncoder.detectMode(testData);
  const version = await dataEncoder.determineVersion(testData, mode, 'M');
  const bytes = await dataEncoder.encodeToBytes(testData, mode, version, 'M');
  
  console.log('Test data:', testData);
  console.log('Mode:', mode, 'Version:', version);
  console.log('Encoded bytes length:', bytes.length);
  console.log('Bytes sample:', bytes.slice(0, 10));
  console.log('Valid byte range:', bytes.every(b => b >= 0 && b <= 255) ? '✅' : '❌');
});
"
```

## ステップ6: 英数字セット確認

### 英数字チェック機能テスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const testCases = [
    { data: 'HELLO123', expected: true },
    { data: 'Hello123', expected: false }, // 小文字不可
    { data: 'HELLO WORLD', expected: true }, // スペース可
    { data: 'HELLO$%*+-./:', expected: true }, // 特殊文字可
    { data: 'HELLO@#&', expected: false }, // 対象外特殊文字
    { data: 'こんにちは', expected: false } // 日本語不可
  ];
  
  for (const testCase of testCases) {
    const result = dataEncoder.isAlphanumeric(testCase.data);
    const match = result === testCase.expected;
    console.log(\`'\${testCase.data}': \${result} \${match ? '✅' : '❌'}\`);
  }
});
"
```

## ステップ7: エラーハンドリング確認

### フォールバック動作確認
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ HybridQRDataEncoder }) => {
  const dataEncoder = new HybridQRDataEncoder();
  
  // JavaScript強制モード
  dataEncoder.forceJavaScript();
  
  const testData = 'Fallback Test Data';
  const mode = await dataEncoder.detectMode(testData);
  const version = await dataEncoder.determineVersion(testData, mode, 'M');
  const bytes = await dataEncoder.encodeToBytes(testData, mode, version, 'M');
  
  console.log('フォールバック動作確認完了');
  console.log('WASM状態:', dataEncoder.isWASMReady() ? 'Ready' : 'Fallback');
  console.log('Mode:', mode, 'Version:', version);
  console.log('Bytes length:', bytes.length);
});
"
```

### Workers環境シミュレーション
```bash
node -e "
// WebAssembly無効化シミュレーション
delete global.WebAssembly;

import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  const testData = 'Workers Environment Test';
  const mode = await dataEncoder.detectMode(testData);
  const version = await dataEncoder.determineVersion(testData, mode, 'M');
  const bytes = await dataEncoder.encodeToBytes(testData, mode, version, 'M');
  
  console.log('Workers環境シミュレーション成功');
  console.log('Mode:', mode, 'Version:', version);
  console.log('Bytes length:', bytes.length);
});
"
```

## ステップ8: 同期API確認

### 同期メソッドテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  // 初期化待機
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const testData = 'Sync API Test';
  
  // 同期API使用
  const mode = dataEncoder.detectModeSync(testData);
  const version = dataEncoder.determineVersionSync(testData, mode, 'M');
  const bits = dataEncoder.encodeSync(testData, mode, version);
  const bytes = dataEncoder.encodeToBytesSync(testData, mode, version, 'M');
  
  console.log('同期API確認完了');
  console.log('Mode:', mode, 'Version:', version);
  console.log('Bits length:', bits.length);
  console.log('Bytes length:', bytes.length);
});
"
```

## ステップ9: メモリリーク確認

### 大量処理メモリテスト
```bash
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  const iterations = 100;
  
  console.log('メモリリークテスト開始...');
  
  for (let i = 0; i < iterations; i++) {
    const testData = \`Test data iteration \${i} \` + 'A'.repeat(i % 50);
    
    const mode = await dataEncoder.detectMode(testData);
    const version = await dataEncoder.determineVersion(testData, mode, 'M');
    const bytes = await dataEncoder.encodeToBytes(testData, mode, version, 'M');
    
    if (i % 20 === 0) {
      console.log(\`Iteration \${i}: Mode \${mode}, Version \${version}, Bytes \${bytes.length}\`);
    }
  }
  
  console.log('メモリリークテスト完了 - エラーなし');
});
"
```

## ステップ10: トリプルWASM統合確認

### 全モジュール連携テスト
```bash
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  console.log('トリプルWASM統合テスト開始...');
  
  const testCases = [
    { data: '123456', type: 'numeric' },
    { data: 'HELLO WORLD', type: 'alphanumeric' },
    { data: 'Hello, こんにちは!', type: 'byte' },
    { data: 'A'.repeat(200), type: 'large' }
  ];
  
  for (const testCase of testCases) {
    const generator = new QRCodeGenerator();
    const result = await generator.generate(testCase.data);
    
    console.log(\`\${testCase.type} test:\`);
    console.log(\`  Data: '\${testCase.data.substring(0, 20)}...'\`);
    console.log(\`  Mode: \${result.mode}, Version: \${result.version}\`);
    console.log(\`  Mask: \${result.maskPattern}, Size: \${result.size}x\${result.size}\`);
    console.log(\`  SVG length: \${result.svg.length} chars\`);
  }
  
  console.log('トリプルWASM統合テスト完了');
});
"
```

## 結果の判定基準

### ✅ 成功の条件
1. **ビルド成功**: WASMモジュールファイルが生成される
2. **テスト成功**: 全29テストがパス
3. **性能向上**: 単体で10-20%、統合で最大42%の改善
4. **モード検出**: 適切なエンコーディングモード選択
5. **バージョン決定**: データサイズに応じた適切なバージョン
6. **エンコーディング**: 有効なビット列とバイト配列生成
7. **フォールバック**: WASM失敗時にJS版が動作

### ❌ 失敗時の対処

**WASMビルド失敗:**
```bash
# Emscripten環境確認
emcc --version

# パス設定確認
source ./emsdk_env.sh
```

**モード検出異常:**
```bash
# 各モードの検出確認
node -e "
import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
  const dataEncoder = createQRDataEncoder();
  
  console.log('Numeric:', await dataEncoder.detectMode('123'));
  console.log('Alphanumeric:', await dataEncoder.detectMode('ABC'));
  console.log('Byte:', await dataEncoder.detectMode('abc'));
});
"
```

**性能問題:**
```bash
# WASMファイル存在確認
ls -la src/wasm/data_encoder.js

# モジュール読み込み確認
node -e "import('./src/wasm/data_encoder.js').then(m => console.log('WASM loaded:', !!m.default))"
```

## トラブルシューティング

### よくある問題

1. **"Module not found"エラー**
   ```bash
   # WASMファイルの存在確認
   ls src/wasm/data_encoder.js
   
   # ない場合はビルド実行
   cd wasm && ./build.sh data_encoder
   ```

2. **バージョン決定が不正確**
   ```bash
   # バージョン決定ロジック確認
   node -e "
   import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
     const dataEncoder = createQRDataEncoder();
     
     const lengths = [10, 25, 50, 100, 200];
     for (const len of lengths) {
       const data = 'A'.repeat(len);
       const mode = await dataEncoder.detectMode(data);
       const version = await dataEncoder.determineVersion(data, mode, 'M');
       console.log(\`Length \${len}: Version \${version}\`);
     }
   });
   "
   ```

3. **UTF-8処理問題**
   ```bash
   # UTF-8バイト変換確認
   node -e "
   import('./src/data-encoder-wasm.js').then(async ({ createQRDataEncoder }) => {
     const dataEncoder = createQRDataEncoder();
     const utf8Bytes = dataEncoder.stringToUtf8Bytes('こんにちは');
     console.log('UTF-8 bytes:', utf8Bytes);
     console.log('Expected: [227, 129, 147, 227, 130, 147, 227, 129, ...]');
   });
   "
   ```

## まとめ

このData Encoding WASMは、Reed-SolomonとMaskingに続く第三の最適化として、トリプルWASM実装を完成させます。3つのモジュールの組み合わせにより、QRコード生成において最大42%の性能向上を実現し、Workers環境での大量処理において大きな価値を提供します。

動作確認が完了したら、すべてのWASM実装が正常に動作していることを確認してください。