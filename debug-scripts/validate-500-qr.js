import { QRCode } from './dist/js-qrcode.esm.js';
import { QRCodeEncoder } from './src/encoder.js';

console.log('=== 500文字QRコード検証 ===');

const test500chars = 'A'.repeat(500);
console.log(`テストデータ: ${test500chars.length}文字`);

try {
  // QRコード生成
  const svg = QRCode.generate(test500chars, { errorCorrectionLevel: 'L' });
  
  // エンコーダー情報
  const encoder = new QRCodeEncoder();
  const encoded = encoder.encode(test500chars, 'L');
  
  console.log('\n📋 QRコード情報:');
  console.log(`- バージョン: ${encoded.version}`);
  console.log(`- サイズ: ${encoded.size}×${encoded.size}`);
  console.log(`- マスクパターン: ${encoded.maskPattern}`);
  console.log(`- データ長: ${test500chars.length}文字`);
  
  // アライメントパターンチェック
  console.log('\n🎯 アライメントパターン検証:');
  const alignmentCenters = encoder.moduleBuilder.patternBuilder.getAlignmentPatternCenters(encoded.version);
  console.log(`- 位置: [${alignmentCenters.join(', ')}]`);
  console.log(`- パターン数: ${alignmentCenters.length}×${alignmentCenters.length} = ${alignmentCenters.length * alignmentCenters.length}`);
  
  // ファインダーパターンとの重複チェック
  let alignmentCount = 0;
  for (const row of alignmentCenters) {
    for (const col of alignmentCenters) {
      // ファインダーパターンとの重複を除外
      const isConflictWithFinder = 
        (row <= 8 && col <= 8) ||                    // 左上
        (row <= 8 && col >= encoded.size - 8) ||     // 右上
        (row >= encoded.size - 8 && col <= 8);       // 左下
      
      if (!isConflictWithFinder) {
        alignmentCount++;
      }
    }
  }
  console.log(`- 実際のアライメント数: ${alignmentCount}`);
  
  // モジュール密度チェック
  const totalModules = encoded.size * encoded.size;
  const darkModules = encoded.modules.flat().filter(m => m).length;
  const density = (darkModules / totalModules * 100).toFixed(1);
  console.log(`\n⚫ モジュール密度:`);
  console.log(`- 総モジュール: ${totalModules}`);
  console.log(`- ダークモジュール: ${darkModules}`);
  console.log(`- 密度: ${density}%`);
  
  // QRコード品質チェック
  console.log('\n✅ 品質チェック:');
  
  // 1. バージョン妥当性
  const versionValid = encoded.version >= 1 && encoded.version <= 15;
  console.log(`- バージョン妥当性: ${versionValid ? '✓' : '✗'}`);
  
  // 2. サイズ妥当性
  const expectedSize = 21 + (encoded.version - 1) * 4;
  const sizeValid = encoded.size === expectedSize;
  console.log(`- サイズ妥当性: ${sizeValid ? '✓' : '✗'} (期待値: ${expectedSize})`);
  
  // 3. 密度妥当性（30-70%が一般的）
  const densityValid = density >= 30 && density <= 70;
  console.log(`- 密度妥当性: ${densityValid ? '✓' : '✗'} (${density}%)`);
  
  // 4. マスクパターン妥当性
  const maskValid = encoded.maskPattern >= 0 && encoded.maskPattern <= 7;
  console.log(`- マスク妥当性: ${maskValid ? '✓' : '✗'} (パターン${encoded.maskPattern})`);
  
  // 5. アライメントパターン妥当性
  const alignmentValid = alignmentCount > 0;
  console.log(`- アライメント妥当性: ${alignmentValid ? '✓' : '✗'} (${alignmentCount}個)`);
  
  console.log('\n🎯 スマホ読み取り改善提案:');
  
  if (density > 60) {
    console.log('⚠️  高密度QRコード - エラー修正レベルを下げることを推奨');
  }
  
  if (encoded.version >= 10) {
    console.log('⚠️  高バージョンQRコード - より短いデータまたはM/Qレベル推奨');
  }
  
  console.log('💡 改善案: エラー修正レベルMで再生成してみてください');
  
} catch (error) {
  console.log(`❌ エラー: ${error.message}`);
}