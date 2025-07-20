#!/usr/bin/env node

import { QRMasking } from './src/masking.js';
import { QRCodeEncoder } from './src/encoder.js';

console.log('=== マスク評価ルールの検証 ===\n');

const testUrl = 'https://google.com';
const errorCorrectionLevel = 'H';

console.log(`テストデータ: "${testUrl}"`);
console.log(`エラー訂正レベル: ${errorCorrectionLevel}\n`);

try {
  const encoder = new QRCodeEncoder();
  const masking = new QRMasking();
  
  // テスト用の小さなマトリックス作成
  console.log('=== Rule 1 (連続モジュール) の検証 ===');
  
  // Rule 1のテストケース: 5連続のパターン
  const rule1TestMatrix = [
    [true, true, true, true, true, false, false],  // 5連続 -> ペナルティ3
    [false, false, false, false, false, false, true], // 5連続 -> ペナルティ3
    [true, false, true, false, true, false, true],  // 連続なし
    [true, true, true, true, true, true, false],    // 6連続 -> ペナルティ4
  ];
  
  const rule1Expected = 3 + 3 + 0 + 4; // = 10
  const rule1Actual = masking.evaluateRule1(rule1TestMatrix, 7);
  
  console.log(`期待値: ${rule1Expected}, 実際: ${rule1Actual}`);
  console.log(`Rule1実装: ${rule1Expected === rule1Actual ? '✓正常' : '❌異常'}\n`);
  
  // Rule 2のテストケース
  console.log('=== Rule 2 (2x2ブロック) の検証 ===');
  
  const rule2TestMatrix = [
    [true, true, false, false],   // 2x2ブロック (0,0)-(1,1)
    [true, true, false, false],   // 2x2ブロック (0,0)-(1,1) 
    [false, false, true, true],   // 2x2ブロック (2,2)-(3,3)
    [false, false, true, true],   // 2x2ブロック (2,2)-(3,3)
  ];
  
  const rule2Expected = 3 + 3; // 2つの2x2ブロック
  const rule2Actual = masking.evaluateRule2(rule2TestMatrix, 4);
  
  console.log(`期待値: ${rule2Expected}, 実際: ${rule2Actual}`);
  console.log(`Rule2実装: ${rule2Expected === rule2Actual ? '✓正常' : '❌異常'}\n`);
  
  // Rule 3のテストケース
  console.log('=== Rule 3 (ファインダーパターン類似) の検証 ===');
  
  // 1011101 パターン（7ビット）+ 前後に4つの白
  const rule3TestMatrix = [
    [false, false, false, false, true, false, true, true, true, false, true, false, false, false, false],
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  ];
  
  // このパターンは Rule 3 のペナルティを発生させるはず
  const rule3Actual = masking.evaluateRule3(rule3TestMatrix, 15);
  console.log(`Rule3結果: ${rule3Actual} (40の倍数であることを期待)`);
  
  // Rule 4のテストケース  
  console.log('\n=== Rule 4 (明暗バランス) の検証 ===');
  
  // 100モジュール中45個が黒（45%）-> 50%から5%の偏差 -> ペナルティ10
  const rule4TestMatrix = Array(10).fill().map((_, row) => 
    Array(10).fill().map((_, col) => row * 10 + col < 45)
  );
  
  const rule4Expected = 10; // Math.floor(5 / 5) * 10 = 10
  const rule4Actual = masking.evaluateRule4(rule4TestMatrix, 10);
  
  console.log(`期待値: ${rule4Expected}, 実際: ${rule4Actual}`);
  console.log(`Rule4実装: ${rule4Expected === rule4Actual ? '✓正常' : '❌異常'}\n`);
  
  // 実際のデータでマスク2と3を比較
  console.log('=== 実データでのマスク2 vs 3比較 ===');
  
  const encoded = encoder.encode(testUrl, errorCorrectionLevel);
  const size = encoded.size;
  
  // ベースモジュール（マスクなし）を取得
  const { QRDataEncoder } = await import('./src/data-encoder.js');
  const { QRModuleBuilder } = await import('./src/module-builder.js');
  const { QRErrorCorrection } = await import('./src/reed-solomon.js');
  
  const dataEncoder = new QRDataEncoder();
  const moduleBuilder = new QRModuleBuilder();
  const errorCorrection = new QRErrorCorrection();
  
  const mode = dataEncoder.detectMode(testUrl);
  const version = dataEncoder.determineVersion(testUrl, mode, errorCorrectionLevel);
  const dataBytes = dataEncoder.encodeToBytes(testUrl, mode, version, errorCorrectionLevel);
  const codewords = errorCorrection.addErrorCorrection(dataBytes, version, errorCorrectionLevel);
  
  let dataBits = '';
  for (const codeword of codewords) {
    dataBits += codeword.toString(2).padStart(8, '0');
  }
  
  const baseModules = moduleBuilder.generateModules(dataBits, version, errorCorrectionLevel);
  
  for (const maskPattern of [2, 3]) {
    console.log(`\nマスク${maskPattern}の詳細分析:`);
    
    const maskedModules = masking.applyMask(baseModules, maskPattern, size);
    
    // 各ルールの詳細分析
    const rule1 = masking.evaluateRule1(maskedModules, size);
    const rule2 = masking.evaluateRule2(maskedModules, size);
    const rule3 = masking.evaluateRule3(maskedModules, size);
    const rule4 = masking.evaluateRule4(maskedModules, size);
    
    console.log(`  Rule 1: ${rule1}`);
    console.log(`  Rule 2: ${rule2}`);
    console.log(`  Rule 3: ${rule3}`);
    console.log(`  Rule 4: ${rule4}`);
    console.log(`  総計: ${rule1 + rule2 + rule3 + rule4}`);
    
    // 明暗バランスの詳細
    let darkCount = 0;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (maskedModules[row][col]) darkCount++;
      }
    }
    const percentage = (darkCount * 100) / (size * size);
    const deviation = Math.abs(percentage - 50);
    console.log(`  明暗バランス: ${darkCount}/${size*size} = ${percentage.toFixed(2)}%, 偏差=${deviation.toFixed(2)}%`);
  }
  
} catch (error) {
  console.error('エラー:', error.message);
  console.error('スタックトレース:', error.stack);
}