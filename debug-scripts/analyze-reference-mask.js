#!/usr/bin/env node

import QRCode from 'qrcode';
import { QRCodeEncoder } from './src/encoder.js';

console.log('=== 参考ライブラリのマスクパターン分析 ===\n');

const testUrl = 'https://google.com';
const errorCorrectionLevel = 'H';

console.log(`テストデータ: "${testUrl}"`);
console.log(`エラー訂正レベル: ${errorCorrectionLevel}\n`);

try {
  // 参考ライブラリで生成
  console.log('参考ライブラリ (qrcode) での生成...');
  const refSvg = await QRCode.toString(testUrl, { 
    type: 'svg',
    errorCorrectionLevel: errorCorrectionLevel,
    margin: 0
  });
  
  // SVGからパターンを抽出
  const refMatch = refSvg.match(/<path[^>]*d="([^"]*)"[^>]*>/);
  if (refMatch) {
    const refPath = refMatch[1];
    const refFirstLine = refPath.split('M')[1]?.split('M')[0] || '';
    
    console.log(`参考ライブラリのSVGパス (最初の行):`);
    console.log(`M${refFirstLine.trim()}`);
    console.log(`全体パス長: ${refPath.length}`);
  }

  // 我々の実装で生成
  console.log('\n我々の実装での生成...');
  const encoder = new QRCodeEncoder();
  const encoded = encoder.encode(testUrl, errorCorrectionLevel);
  
  console.log(`バージョン: ${encoded.version}`);
  console.log(`サイズ: ${encoded.size}x${encoded.size}`);
  console.log(`選択されたマスクパターン: ${encoded.maskPattern}`);
  
  // 各マスクパターンのペナルティを計算
  console.log('\n=== 各マスクパターンのペナルティ ===');
  
  const { QRMasking } = await import('./src/masking.js');
  const masking = new QRMasking();
  
  // ベースモジュール（マスクなし）を取得
  const { QRModuleBuilder } = await import('./src/module-builder.js');
  const { QRDataEncoder } = await import('./src/data-encoder.js');
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
  const size = 21 + (version - 1) * 4;
  
  const maskResults = [];
  
  for (let maskPattern = 0; maskPattern < 8; maskPattern++) {
    const maskedModules = masking.applyMask(baseModules, maskPattern, size);
    const penalty = masking.evaluateMask(maskedModules, size);
    
    // 各ルールのペナルティを個別計算
    const rule1 = masking.evaluateRule1(maskedModules, size);
    const rule2 = masking.evaluateRule2(maskedModules, size);
    const rule3 = masking.evaluateRule3(maskedModules, size);
    const rule4 = masking.evaluateRule4(maskedModules, size);
    
    maskResults.push({
      pattern: maskPattern,
      penalty,
      rule1,
      rule2,
      rule3,
      rule4
    });
    
    console.log(`マスク${maskPattern}: 総ペナルティ=${penalty} (R1:${rule1}, R2:${rule2}, R3:${rule3}, R4:${rule4})`);
  }
  
  // 最良マスクを特定
  const bestMask = maskResults.reduce((best, current) => 
    current.penalty < best.penalty ? current : best
  );
  
  console.log(`\n最良マスク: パターン${bestMask.pattern} (ペナルティ: ${bestMask.penalty})`);
  
  // マスクパターンごとの最初の行を比較
  console.log('\n=== 最初の行の比較 (各マスクパターン) ===');
  
  const firstRowBase = baseModules[0];
  console.log(`ベース(マスクなし): [${firstRowBase.map((m, i) => m ? i : null).filter(i => i !== null).join(', ')}]`);
  
  // 参考ライブラリの最初の行を解析
  if (refMatch) {
    const refPath = refMatch[1];
    const refFirstLine = refPath.split('m')[0]; // 'M0 0.5h7' のような最初の部分
    console.log(`参考ライブラリの最初の行: ${refFirstLine}`);
  }
  
  for (let maskPattern = 0; maskPattern < 8; maskPattern++) {
    const maskedRow = [];
    
    for (let col = 0; col < firstRowBase.length; col++) {
      let shouldMask = false;
      
      // マスクパターン関数を使用
      const maskFunctions = [
        (row, col) => (row + col) % 2 === 0,
        (row, col) => row % 2 === 0,
        (row, col) => col % 3 === 0,
        (row, col) => (row + col) % 3 === 0,
        (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
        (row, col) => ((row * col) % 2) + ((row * col) % 3) === 0,
        (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
        (row, col) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
      ];
      
      if (!masking.isReservedModule(0, col, size)) {
        shouldMask = maskFunctions[maskPattern](0, col);
      }
      
      maskedRow[col] = shouldMask ? !firstRowBase[col] : firstRowBase[col];
    }
    
    const maskedPositions = maskedRow.map((m, i) => m ? i : null).filter(i => i !== null);
    console.log(`マスク${maskPattern}: [${maskedPositions.join(', ')}]`);
  }

} catch (error) {
  console.error('エラー:', error.message);
  console.error('スタックトレース:', error.stack);
}