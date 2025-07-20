// QRコード容量テーブルの検証

console.log('=== QRコード容量テーブル検証 ===');

// 標準的なQRコード容量テーブル（ISO/IEC 18004準拠）
// [数値, 英数字, バイナリ, 漢字]の順
const STANDARD_CAPACITY_TABLE = {
  1: { L: [41, 25, 17, 10], M: [34, 20, 14, 8], Q: [27, 16, 11, 7], H: [17, 10, 7, 4] },
  2: { L: [77, 47, 32, 20], M: [63, 38, 26, 16], Q: [48, 29, 20, 12], H: [34, 20, 14, 8] },
  3: { L: [127, 77, 53, 32], M: [101, 61, 42, 26], Q: [77, 47, 32, 20], H: [58, 35, 24, 15] },
  4: { L: [187, 114, 78, 48], M: [149, 90, 62, 38], Q: [111, 67, 46, 28], H: [82, 50, 34, 21] },
  5: { L: [255, 154, 106, 65], M: [202, 122, 84, 52], Q: [144, 87, 60, 37], H: [106, 64, 44, 27] },
};

const testUrl = 'https://google.com';

console.log(`テストURL: "${testUrl}"`);
console.log(`文字数: ${testUrl.length}`);
console.log(`バイナリバイト数: ${testUrl.length} (ASCII)`);

console.log('\n=== 標準容量テーブル (バイナリモード, エラー訂正H) ===');
for (let version = 1; version <= 5; version++) {
  const capacity = STANDARD_CAPACITY_TABLE[version].H[2]; // バイナリモード
  const fits = testUrl.length <= capacity;
  const status = fits ? '✅' : '❌';
  console.log(`バージョン${version}: ${capacity}バイト ${status}`);
  
  if (fits) {
    console.log(`→ 標準テーブルでは バージョン${version} が選択される`);
    break;
  }
}

// 我々の現在のテーブルと比較
console.log('\n=== 我々の現在のテーブルとの比較 ===');
try {
  const { CAPACITY_TABLE } = await import('./src/constants.js');
  
  for (let version = 1; version <= 5; version++) {
    const standardCap = STANDARD_CAPACITY_TABLE[version].H[2];
    const ourCap = CAPACITY_TABLE[version]?.H?.[2];
    
    const match = standardCap === ourCap ? '✅' : '❌';
    console.log(`バージョン${version}: 標準=${standardCap}, 我々=${ourCap} ${match}`);
  }
  
} catch (error) {
  console.error('テーブル読み込みエラー:', error.message);
}

console.log('\n=== 結論 ===');
console.log('標準テーブルでは:');
console.log('- バージョン3: 24バイト (18バイト必要 ✅)');
console.log('- これが参考ライブラリがバージョン3を選ぶ理由');
console.log('');
console.log('修正が必要:');
console.log('1. 我々の容量テーブルを標準準拠に修正');
console.log('2. バージョン選択ロジックの確認');