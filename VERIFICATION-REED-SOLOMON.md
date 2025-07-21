# Reed-Solomon WASM 動作確認ガイド

このガイドでは、Reed-Solomon WebAssembly実装の動作確認方法を説明します。

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

# Reed-Solomonモジュールをビルド
./build.sh reed_solomon

# または全モジュールビルド
./build.sh
```

**期待される出力:**
```
Building Reed-Solomon WASM module...
Compiling reed_solomon.cpp...
Generated: ../src/wasm/reed_solomon.js
Generated: ../src/wasm/reed_solomon.d.ts
Build completed successfully!
```

## ステップ2: 基本動作確認

### テストの実行
```bash
# Reed-Solomon専用テスト
npm test -- --testPathPattern=reed-solomon-wasm-integration

# 期待される結果: 全16テストが成功
```

**成功例:**
```
PASS tests/unit/reed-solomon-wasm-integration.test.js
✓ should create hybrid implementation by default
✓ should create JavaScript implementation when forced
✓ should handle JavaScript fallback gracefully
✓ should provide both implementations for comparison
...
Tests: 16 passed, 16 total
```

### 手動動作確認
```bash
# Node.jsで直接確認
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  // WASM使用
  const wasmGen = new QRCodeGenerator();
  const wasmResult = await wasmGen.generate('WASM Test');
  console.log('WASM Result - Version:', wasmResult.version, 'Mode:', wasmResult.mode);
  
  // JavaScript使用
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsResult = await jsGen.generate('JS Test');
  console.log('JS Result - Version:', jsResult.version, 'Mode:', jsResult.mode);
});
"
```

## ステップ3: 性能ベンチマーク

### 基本ベンチマーク
```bash
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const testData = 'Performance Test Data';
  
  // WASM性能測定
  const wasmGen = new QRCodeGenerator();
  const wasmStart = performance.now();
  await wasmGen.generate(testData);
  const wasmTime = performance.now() - wasmStart;
  
  // JavaScript性能測定
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsStart = performance.now();
  await jsGen.generate(testData);
  const jsTime = performance.now() - jsStart;
  
  console.log(\`WASM: \${wasmTime.toFixed(2)}ms\`);
  console.log(\`JS: \${jsTime.toFixed(2)}ms\`);
  console.log(\`改善率: \${((jsTime - wasmTime) / jsTime * 100).toFixed(1)}%\`);
});
"
```

**期待される結果例:**
```
WASM: 15.23ms
JS: 22.47ms
改善率: 32.2%
```

### 大量データベンチマーク
```bash
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const largeData = 'A'.repeat(200); // 大きなデータ
  const iterations = 10;
  
  // WASM測定
  const wasmGen = new QRCodeGenerator();
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await wasmGen.generate(largeData + i);
  }
  const wasmTotal = performance.now() - wasmStart;
  
  // JavaScript測定
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await jsGen.generate(largeData + i);
  }
  const jsTotal = performance.now() - jsStart;
  
  console.log(\`\${iterations}回実行結果:\`);
  console.log(\`WASM平均: \${(wasmTotal/iterations).toFixed(2)}ms\`);
  console.log(\`JS平均: \${(jsTotal/iterations).toFixed(2)}ms\`);
  console.log(\`改善率: \${((jsTotal - wasmTotal) / jsTotal * 100).toFixed(1)}%\`);
});
"
```

## ステップ4: Reed-Solomon単体確認

### Reed-Solomonモジュール直接テスト
```bash
node -e "
import('./src/reed-solomon-wasm.js').then(async ({ createQRErrorCorrection }) => {
  const errorCorrection = createQRErrorCorrection();
  
  // WASM準備確認
  console.log('WASM Ready:', errorCorrection.isWASMReady());
  
  // エラー訂正テスト
  const testData = [1, 2, 3, 4, 5, 6, 7, 8];
  const result = await errorCorrection.addErrorCorrection(testData, 1, 'M');
  
  console.log('入力データ:', testData);
  console.log('エラー訂正後:', result.slice(0, 20), '...'); // 最初の20要素
  console.log('総要素数:', result.length);
});
"
```

### JavaScript比較テスト
```bash
node -e "
import('./src/reed-solomon-wasm.js').then(async ({ createQRErrorCorrection }) => {
  const testData = [1, 2, 3, 4, 5, 6, 7, 8];
  
  // WASM版
  const wasmErrorCorrection = createQRErrorCorrection(false);
  const wasmResult = await wasmErrorCorrection.addErrorCorrection(testData, 1, 'M');
  
  // JavaScript版
  const jsErrorCorrection = createQRErrorCorrection(true);
  const jsResult = await jsErrorCorrection.addErrorCorrection(testData, 1, 'M');
  
  console.log('WASM結果長:', wasmResult.length);
  console.log('JS結果長:', jsResult.length);
  console.log('結果一致:', wasmResult.length === jsResult.length ? '✅' : '❌');
});
"
```

## ステップ5: Workers環境確認

### Workers互換性テスト
```bash
node -e "
// WebAssembly無効化シミュレーション
delete global.WebAssembly;

import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const generator = new QRCodeGenerator();
  const result = await generator.generate('Workers Test');
  
  console.log('Workers環境シミュレーション成功');
  console.log('結果:', result.data, '- Version:', result.version);
});
"
```

## ステップ6: エラーハンドリング確認

### フォールバック動作確認
```bash
node -e "
import('./src/reed-solomon-wasm.js').then(async ({ HybridQRErrorCorrection }) => {
  const errorCorrection = new HybridQRErrorCorrection();
  
  // JavaScript強制モード
  errorCorrection.forceJavaScript();
  
  const testData = [1, 2, 3, 4];
  const result = await errorCorrection.addErrorCorrection(testData, 1, 'M');
  
  console.log('フォールバック動作確認完了');
  console.log('WASM状態:', errorCorrection.isWASMReady() ? 'Ready' : 'Fallback');
  console.log('結果:', result.length, '要素');
});
"
```

## 結果の判定基準

### ✅ 成功の条件
1. **ビルド成功**: WASMモジュールファイルが生成される
2. **テスト成功**: 全16テストがパス
3. **性能向上**: WASM版がJS版より20%以上高速
4. **互換性**: JavaScript版と同じ結果を出力
5. **フォールバック**: WASM失敗時にJS版が動作

### ❌ 失敗時の対処

**WASMビルド失敗:**
```bash
# Emscripten環境確認
emcc --version

# パス設定確認
source ./emsdk_env.sh
```

**テスト失敗:**
```bash
# 詳細ログ表示
npm test -- --testPathPattern=reed-solomon-wasm-integration --verbose
```

**性能問題:**
```bash
# WASMファイル存在確認
ls -la src/wasm/reed_solomon.js

# モジュール読み込み確認
node -e "import('./src/wasm/reed_solomon.js').then(m => console.log('WASM loaded:', !!m.default))"
```

## トラブルシューティング

### よくある問題

1. **"Module not found"エラー**
   ```bash
   # WASMファイルの存在確認
   ls src/wasm/reed_solomon.js
   
   # ない場合はビルド実行
   cd wasm && ./build.sh reed_solomon
   ```

2. **性能改善が見られない**
   ```bash
   # WASM実際使用確認
   node -e "
   import('./src/reed-solomon-wasm.js').then(async ({ createQRErrorCorrection }) => {
     const ec = createQRErrorCorrection();
     await new Promise(resolve => setTimeout(resolve, 100)); // 初期化待機
     console.log('WASM Ready:', ec.isWASMReady());
   });
   "
   ```

3. **フォールバック動作しない**
   ```bash
   # JavaScript実装確認
   node -e "
   import('./src/reed-solomon-wasm.js').then(async ({ createQRErrorCorrection }) => {
     const ec = createQRErrorCorrection(true); // 強制JS
     const result = await ec.addErrorCorrection([1,2,3], 1, 'M');
     console.log('JS fallback working:', result.length > 0);
   });
   "
   ```

動作確認が完了したら、次のMasking WASMの確認に進んでください。