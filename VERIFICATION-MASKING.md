# Masking WASM 動作確認ガイド

このガイドでは、Masking Pattern Evaluation WebAssembly実装の動作確認方法を説明します。

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

# Maskingモジュールをビルド
./build.sh masking

# または全モジュールビルド
./build.sh
```

**期待される出力:**
```
Building Masking WASM module...
Compiling masking.cpp...
Generated: ../src/wasm/masking.js
Generated: ../src/wasm/masking.d.ts
Build completed successfully!
```

## ステップ2: 基本動作確認

### テストの実行
```bash
# Masking専用テスト
npm test -- --testPathPattern=masking-wasm-integration

# 期待される結果: 全21テストが成功
```

**成功例:**
```
PASS tests/unit/masking-wasm-integration.test.js
✓ should create hybrid implementation by default
✓ should create JavaScript implementation when forced
✓ should handle JavaScript fallback gracefully for mask finding
✓ should handle JavaScript fallback gracefully for mask application
✓ should find best mask pattern effectively
...
Tests: 21 passed, 21 total
```

### 手動動作確認
```bash
# Node.jsで直接確認
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  // WASM使用
  const wasmGen = new QRCodeGenerator();
  const wasmResult = await wasmGen.generate('Masking Test');
  console.log('WASM Result - Mask Pattern:', wasmResult.maskPattern, 'Version:', wasmResult.version);
  
  // JavaScript使用
  const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
  const jsResult = await jsGen.generate('Masking Test');
  console.log('JS Result - Mask Pattern:', jsResult.maskPattern, 'Version:', jsResult.version);
});
"
```

## ステップ3: マスクパターン評価確認

### 8つのマスクパターンテスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  
  // 簡単なテスト用モジュール
  const size = 21;
  const modules = Array(size).fill().map(() => Array(size).fill(0));
  
  console.log('WASM Ready:', masking.isWASMReady());
  
  // 各マスクパターンのテスト
  for (let mask = 0; mask < 8; mask++) {
    const score = await masking.evaluateMask(modules, mask, size);
    console.log(\`Mask \${mask}: Score \${score}\`);
  }
});
"
```

### ベストマスク選択テスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  
  // テスト用モジュール（21x21）
  const size = 21;
  const modules = Array(size).fill().map(() => 
    Array(size).fill().map(() => Math.random() > 0.5 ? 1 : 0)
  );
  
  // ベストマスク検索
  const bestMask = await masking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  console.log('Best Mask Pattern:', bestMask);
  console.log('Valid range (0-7):', bestMask >= 0 && bestMask <= 7 ? '✅' : '❌');
});
"
```

## ステップ4: 性能ベンチマーク

### マスク評価性能比較
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const size = 21;
  const modules = Array(size).fill().map(() => 
    Array(size).fill().map(() => Math.random() > 0.5 ? 1 : 0)
  );
  
  // WASM性能測定
  const wasmMasking = createQRMasking(false);
  const wasmStart = performance.now();
  await wasmMasking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  const wasmTime = performance.now() - wasmStart;
  
  // JavaScript性能測定
  const jsMasking = createQRMasking(true);
  const jsStart = performance.now();
  await jsMasking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  const jsTime = performance.now() - jsStart;
  
  console.log(\`WASM: \${wasmTime.toFixed(2)}ms\`);
  console.log(\`JS: \${jsTime.toFixed(2)}ms\`);
  console.log(\`改善率: \${((jsTime - wasmTime) / jsTime * 100).toFixed(1)}%\`);
});
"
```

**期待される結果例:**
```
WASM: 2.15ms
JS: 4.23ms
改善率: 49.2%
```

### 大きなQRコードでの性能テスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const size = 45; // Version 3 size
  const modules = Array(size).fill().map(() => 
    Array(size).fill().map(() => Math.random() > 0.5 ? 1 : 0)
  );
  
  const iterations = 5;
  
  // WASM測定
  const wasmMasking = createQRMasking(false);
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await wasmMasking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  }
  const wasmTotal = performance.now() - wasmStart;
  
  // JavaScript測定
  const jsMasking = createQRMasking(true);
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await jsMasking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  }
  const jsTotal = performance.now() - jsStart;
  
  console.log(\`\${iterations}回実行結果 (Size: \${size}x\${size}):\`);
  console.log(\`WASM平均: \${(wasmTotal/iterations).toFixed(2)}ms\`);
  console.log(\`JS平均: \${(jsTotal/iterations).toFixed(2)}ms\`);
  console.log(\`改善率: \${((jsTotal - wasmTotal) / jsTotal * 100).toFixed(1)}%\`);
});
"
```

## ステップ5: マスク適用確認

### マスクパターン適用テスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  
  // テスト用モジュール
  const size = 21;
  const originalModules = Array(size).fill().map((_, i) => 
    Array(size).fill().map((_, j) => (i + j) % 2)
  );
  
  console.log('Original pattern (first row):', originalModules[0].slice(0, 10));
  
  // 各マスクパターンを適用
  for (let mask = 0; mask < 8; mask++) {
    const maskedModules = await masking.applyMask(originalModules, mask, size);
    console.log(\`Mask \${mask} applied (first row):`, maskedModules[0].slice(0, 10));
  }
});
"
```

### マスク適用の可逆性テスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  
  const size = 21;
  const original = Array(size).fill().map(() => 
    Array(size).fill().map(() => Math.random() > 0.5 ? 1 : 0)
  );
  
  for (let mask = 0; mask < 8; mask++) {
    // マスク適用
    const masked = await masking.applyMask(original, mask, size);
    // マスク再適用（元に戻るはず）
    const unmasked = await masking.applyMask(masked, mask, size);
    
    // 比較
    let identical = true;
    for (let i = 0; i < size && identical; i++) {
      for (let j = 0; j < size && identical; j++) {
        if (original[i][j] !== unmasked[i][j]) {
          identical = false;
        }
      }
    }
    
    console.log(\`Mask \${mask} reversibility: \${identical ? '✅' : '❌'}\`);
  }
});
"
```

## ステップ6: QRコード統合確認

### フルQRコード生成での動作確認
```bash
node -e "
import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
  const testCases = [
    'Hello WASM!',
    '1234567890',
    'HELLO WORLD 123',
    'A'.repeat(100)
  ];
  
  for (const testData of testCases) {
    // WASM版
    const wasmGen = new QRCodeGenerator();
    const wasmResult = await wasmGen.generate(testData);
    
    // JavaScript版
    const jsGen = new QRCodeGenerator(undefined, undefined, { forceJS: true });
    const jsResult = await jsGen.generate(testData);
    
    console.log(\`Data: '\${testData.substring(0, 20)}...':\`);
    console.log(\`  WASM Mask: \${wasmResult.maskPattern}, JS Mask: \${jsResult.maskPattern}\`);
    console.log(\`  Same mask: \${wasmResult.maskPattern === jsResult.maskPattern ? '✅' : '❌'}\`);
  }
});
"
```

## ステップ7: エラーハンドリング確認

### フォールバック動作確認
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ HybridQRMasking }) => {
  const masking = new HybridQRMasking();
  
  // JavaScript強制モード
  masking.forceJavaScript();
  
  const size = 21;
  const modules = Array(size).fill().map(() => Array(size).fill(0));
  
  const bestMask = await masking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  const maskedModules = await masking.applyMask(modules, bestMask, size);
  
  console.log('フォールバック動作確認完了');
  console.log('WASM状態:', masking.isWASMReady() ? 'Ready' : 'Fallback');
  console.log('Best mask:', bestMask);
  console.log('Masked modules size:', maskedModules.length, 'x', maskedModules[0].length);
});
"
```

### Workers環境シミュレーション
```bash
node -e "
// WebAssembly無効化シミュレーション
delete global.WebAssembly;

import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  
  const size = 21;
  const modules = Array(size).fill().map(() => Array(size).fill(0));
  
  const bestMask = await masking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
  
  console.log('Workers環境シミュレーション成功');
  console.log('Best mask without WASM:', bestMask);
});
"
```

## ステップ8: 評価ルールの詳細確認

### 4つの評価ルール個別テスト
```bash
node -e "
import('./src/masking-wasm.js').then(async ({ HybridQRMasking }) => {
  const masking = new HybridQRMasking();
  
  // パターンのあるテスト用モジュール
  const size = 21;
  const modules = Array(size).fill().map((_, i) => 
    Array(size).fill().map((_, j) => {
      // チェッカーボードパターン
      return (i + j) % 2;
    })
  );
  
  if (masking.wasmInstance) {
    console.log('Individual rule evaluation:');
    try {
      const rule1 = masking.wasmInstance.evaluateRule1(modules, size);
      const rule2 = masking.wasmInstance.evaluateRule2(modules, size);
      const rule3 = masking.wasmInstance.evaluateRule3(modules, size);
      const rule4 = masking.wasmInstance.evaluateRule4(modules, size);
      
      console.log('Rule 1 (同色連続):', rule1);
      console.log('Rule 2 (2x2ブロック):', rule2);
      console.log('Rule 3 (1:1:3:1:1パターン):', rule3);
      console.log('Rule 4 (暗:明比率):', rule4);
      console.log('Total penalty:', rule1 + rule2 + rule3 + rule4);
    } catch (error) {
      console.log('Individual rule evaluation requires WASM module');
    }
  } else {
    console.log('WASM not available, using JavaScript implementation');
  }
});
"
```

## 結果の判定基準

### ✅ 成功の条件
1. **ビルド成功**: WASMモジュールファイルが生成される
2. **テスト成功**: 全21テストがパス
3. **性能向上**: WASM版がJS版より30%以上高速
4. **マスク選択**: 0-7の範囲内の有効なマスクパターンを選択
5. **可逆性**: マスク適用→再適用で元のパターンに戻る
6. **フォールバック**: WASM失敗時にJS版が動作

### ❌ 失敗時の対処

**WASMビルド失敗:**
```bash
# Emscripten環境確認
emcc --version

# パス設定確認
source ./emsdk_env.sh
```

**マスクパターン異常:**
```bash
# マスクパターン範囲確認
node -e "
import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
  const masking = createQRMasking();
  const size = 21;
  const modules = Array(size).fill().map(() => Array(size).fill(0));
  
  for (let i = 0; i < 10; i++) {
    const mask = await masking.findBestMask(modules, size, { errorCorrectionLevel: 'M' });
    console.log(\`Attempt \${i+1}: Mask \${mask} (valid: \${mask >= 0 && mask <= 7})\`);
  }
});
"
```

**性能問題:**
```bash
# WASMファイル存在確認
ls -la src/wasm/masking.js

# モジュール読み込み確認
node -e "import('./src/wasm/masking.js').then(m => console.log('WASM loaded:', !!m.default))"
```

## トラブルシューティング

### よくある問題

1. **"Module not found"エラー**
   ```bash
   # WASMファイルの存在確認
   ls src/wasm/masking.js
   
   # ない場合はビルド実行
   cd wasm && ./build.sh masking
   ```

2. **マスクパターンが常に同じ**
   ```bash
   # 異なるデータでのテスト
   node -e "
   import('./src/generator.js').then(async ({ QRCodeGenerator }) => {
     const gen = new QRCodeGenerator();
     const patterns = [];
     for (let i = 0; i < 10; i++) {
       const result = await gen.generate('Test' + i);
       patterns.push(result.maskPattern);
     }
     console.log('Mask patterns:', [...new Set(patterns)]);
     console.log('Variety check:', new Set(patterns).size > 1 ? '✅' : '❌');
   });
   "
   ```

3. **性能改善が見られない**
   ```bash
   # WASM実際使用確認
   node -e "
   import('./src/masking-wasm.js').then(async ({ createQRMasking }) => {
     const masking = createQRMasking();
     await new Promise(resolve => setTimeout(resolve, 100)); // 初期化待機
     console.log('WASM Ready:', masking.isWASMReady());
   });
   "
   ```

動作確認が完了したら、次のData Encoding WASMの確認に進んでください。