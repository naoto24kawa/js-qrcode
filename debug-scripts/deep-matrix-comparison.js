import qrcode from 'qrcode';
import QRCode from './src/index.js';

const testUrl = 'https://google.com';

console.log('=== 深層QRマトリックス比較 ===');

// 参考ライブラリから内部データを取得
console.log('1. 参考ライブラリの内部データ取得...');

// 参考ライブラリのエンコード結果を取得
let referenceMatrix = null;
let referenceData = null;

try {
  // 参考ライブラリの内部APIを使用してマトリックスを取得
  const QRCode_ref = await import('qrcode/lib/core/qrcode.js');
  const segments = await import('qrcode/lib/core/segments.js');
  
  // データをセグメントに変換
  const segs = segments.default.fromString(testUrl);
  
  // QRコードを作成
  const qr = QRCode_ref.default.create(segs, { errorCorrectionLevel: 'H' });
  
  referenceMatrix = qr.modules;
  referenceData = {
    version: qr.version,
    size: qr.modules.size,
    maskPattern: qr.maskPattern,
    errorCorrectionLevel: qr.errorCorrectionLevel
  };
  
  console.log('参考ライブラリデータ:');
  console.log(`- バージョン: ${referenceData.version}`);
  console.log(`- サイズ: ${referenceData.size}x${referenceData.size}`);
  console.log(`- マスクパターン: ${referenceData.maskPattern}`);
  console.log(`- エラー訂正: ${referenceData.errorCorrectionLevel}`);
  
} catch (error) {
  console.error('参考ライブラリ内部データ取得エラー:', error.message);
}

// 我々の実装
console.log('\n2. 我々の実装データ取得...');
try {
  const { QRCodeEncoder } = await import('./src/encoder.js');
  const encoder = new QRCodeEncoder();
  
  const ourEncoded = encoder.encode(testUrl, 'H');
  
  console.log('我々の実装データ:');
  console.log(`- バージョン: ${ourEncoded.version}`);
  console.log(`- サイズ: ${ourEncoded.size}x${ourEncoded.size}`);
  console.log(`- マスクパターン: ${ourEncoded.maskPattern}`);
  
  // マトリックス比較
  if (referenceMatrix && ourEncoded.modules) {
    console.log('\n3. マトリックス詳細比較...');
    
    const refSize = referenceData.size;
    const ourSize = ourEncoded.size;
    
    if (refSize !== ourSize) {
      console.log(`❌ サイズ不一致: 参考=${refSize} vs 我々=${ourSize}`);
    } else {
      console.log(`✅ サイズ一致: ${refSize}x${refSize}`);
      
      // 行ごとの比較
      let diffCount = 0;
      const maxDiffToShow = 20;
      
      for (let row = 0; row < refSize; row++) {
        for (let col = 0; col < refSize; col++) {
          const refBit = referenceMatrix.get(row, col);
          const ourBit = ourEncoded.modules[row][col];
          
          if (refBit !== ourBit) {
            if (diffCount < maxDiffToShow) {
              console.log(`❌ 差異 [${row},${col}]: 参考=${refBit} vs 我々=${ourBit}`);
            }
            diffCount++;
          }
        }
      }
      
      if (diffCount === 0) {
        console.log('✅ マトリックス完全一致！');
      } else {
        console.log(`❌ 合計 ${diffCount} 個の差異が見つかりました`);
        
        if (diffCount > maxDiffToShow) {
          console.log(`   (最初の${maxDiffToShow}個のみ表示)`);
        }
      }
    }
    
    // バージョン比較
    if (referenceData.version !== ourEncoded.version) {
      console.log(`❌ バージョン不一致: 参考=${referenceData.version} vs 我々=${ourEncoded.version}`);
    }
    
    // マスクパターン比較
    if (referenceData.maskPattern !== ourEncoded.maskPattern) {
      console.log(`❌ マスクパターン不一致: 参考=${referenceData.maskPattern} vs 我々=${ourEncoded.maskPattern}`);
    }
    
  } else {
    console.log('❌ マトリックス取得失敗');
  }
  
} catch (error) {
  console.error('我々の実装エラー:', error.message);
  console.error(error.stack);
}

console.log('\n4. 基本的なQRコード要件チェック...');
console.log('- ファインダーパターン (左上、右上、左下)');
console.log('- タイミングパターン (行6、列6)');
console.log('- アライメントパターン (バージョン2以上)');
console.log('- フォーマット情報');
console.log('- データ領域とエラー訂正符号');

console.log('\n次のステップ:');
console.log('1. マトリックス差異の詳細分析');
console.log('2. 個別パターンの検証');
console.log('3. エンコーディングアルゴリズムの見直し');