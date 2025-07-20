// 参考ライブラリの処理方法を完全に複製
import QRCode from 'qrcode';

console.log('=== 参考ライブラリの完全複製分析 ===');

const testUrl = 'https://google.com';

try {
  console.log('1. 参考ライブラリの全プロセス分析...');
  
  const refQR = QRCode.create(testUrl, { errorCorrectionLevel: 'H' });
  const size = refQR.modules.size;
  const refModules = refQR.modules.data;
  
  console.log('参考ライブラリ基本情報:');
  console.log('- バージョン:', refQR.version);
  console.log('- エラー訂正レベル:', refQR.errorCorrectionLevel.bit);
  console.log('- マスクパターン:', refQR.maskPattern);
  console.log('- サイズ:', size);
  
  // セグメント詳細
  const segment = refQR.segments[0];
  console.log('- モード:', segment.mode.id, 'bit:', segment.mode.bit);
  console.log('- データ長:', segment.data.length);
  console.log('- データ:', Array.from(segment.data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  console.log('\\n2. 参考ライブラリの内部処理推定...');
  
  // 参考ライブラリは生のUTF-8バイトを直接使用している可能性
  const urlBytes = Array.from(new TextEncoder().encode(testUrl));
  const segmentBytes = Array.from(segment.data);
  
  console.log('URL UTF-8バイト:', urlBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('セグメントバイト:', segmentBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('バイト一致:', JSON.stringify(urlBytes) === JSON.stringify(segmentBytes));
  
  // 参考ライブラリが使用する可能性のあるエンコーディング方法を推定
  console.log('\\n3. 参考ライブラリエンコーディング方法推定...');
  
  // QR仕様に従った標準エンコーディング
  console.log('標準QRエンコーディング:');
  const mode = 4; // バイトモード
  const charCount = urlBytes.length;
  
  // モードインジケータ + 文字数インジケータ + データ
  let standardBits = '';
  standardBits += mode.toString(2).padStart(4, '0'); // モード: 0100
  standardBits += charCount.toString(2).padStart(8, '0'); // 文字数 (8ビット、バージョン3)
  
  // データビット
  for (const byte of urlBytes) {
    standardBits += byte.toString(2).padStart(8, '0');
  }
  
  console.log('標準ビット長:', standardBits.length);
  console.log('標準ビット:', standardBits.substring(0, 40) + '...');
  
  // 参考ライブラリマスク解除データ分析
  console.log('\\n4. 参考ライブラリマスク解除データ分析...');
  
  // 2次元配列化
  const refMatrix = [];
  for (let row = 0; row < size; row++) {
    const rowData = [];
    for (let col = 0; col < size; col++) {
      rowData.push(refModules[row * size + col] ? 1 : 0);
    }
    refMatrix.push(rowData);
  }
  
  // データ領域抽出
  const refDataBits = [];
  const dataPositions = [];
  let direction = -1;
  let bitIndex = 0;
  
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    
    for (let i = 0; i < size; i++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = direction === -1 ? size - 1 - i : i;
        
        if (!isStructuralModule(y, x, size)) {
          refDataBits.push(refMatrix[y][x]);
          dataPositions.push({ row: y, col: x, index: bitIndex });
          bitIndex++;
        }
      }
    }
    direction = -direction;
  }
  
  // マスク解除
  const refUnmasked = [];
  for (let i = 0; i < refDataBits.length; i++) {
    const pos = dataPositions[i];
    const maskValue = getMaskValue(refQR.maskPattern, pos.row, pos.col);
    const unmaskedBit = refDataBits[i] ^ maskValue;
    refUnmasked.push(unmaskedBit);
  }
  
  console.log('参考ライブラリデータビット数:', refDataBits.length);
  console.log('参考ライブラリマスク解除:', refUnmasked.slice(0, 50).join(''));
  
  // バイト変換
  const refUnmaskedBytes = [];
  for (let i = 0; i < refUnmasked.length; i += 8) {
    const byteBits = refUnmasked.slice(i, i + 8);
    if (byteBits.length === 8) {
      refUnmaskedBytes.push(parseInt(byteBits.join(''), 2));
    }
  }
  
  console.log('参考ライブラリバイト:', refUnmaskedBytes.slice(0, 25).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  console.log('\\n5. 参考ライブラリの実際のエンコーディング逆解析...');
  
  // 参考ライブラリの最初の数バイトから実際のエンコーディングを推定
  const firstByte = refUnmaskedBytes[0]; // 0x41
  const secondByte = refUnmaskedBytes[1]; // 0x76
  
  console.log('最初のバイト: 0x' + firstByte.toString(16), '(', firstByte.toString(2).padStart(8, '0'), ')');
  console.log('2番目のバイト: 0x' + secondByte.toString(16), '(', secondByte.toString(2).padStart(8, '0'), ')');
  
  // 0x41 = 01000001 = モードインジケータ(0100) + 文字数上位(0001)
  // 0x76 = 01110110 = 文字数下位(0111) + データ開始(0110)
  
  const modeIndicator = (firstByte >> 4) & 0xF; // 上位4ビット
  const charCountHigh = firstByte & 0xF; // 下位4ビット
  const charCountLow = (secondByte >> 4) & 0xF; // 上位4ビット
  const dataStart = secondByte & 0xF; // 下位4ビット
  
  console.log('推定モードインジケータ:', modeIndicator, '(期待: 4)');
  console.log('推定文字数上位:', charCountHigh);
  console.log('推定文字数下位:', charCountLow);
  console.log('推定文字数:', (charCountHigh << 4) | charCountLow, '(期待:', urlBytes.length, ')');
  console.log('データ開始:', dataStart.toString(2).padStart(4, '0'));
  
  // 実際のURLデータが始まる位置を確認
  const expectedFirstUrlByte = urlBytes[0]; // 0x68 = 'h'
  console.log('期待する最初のURLバイト: 0x' + expectedFirstUrlByte.toString(16), '(', String.fromCharCode(expectedFirstUrlByte), ')');
  
  // 3番目のバイトから実際のURL開始を確認
  const thirdByte = refUnmaskedBytes[2]; // 0x26
  console.log('3番目のバイト: 0x' + thirdByte.toString(16), '(', thirdByte.toString(2).padStart(8, '0'), ')');
  
  // ビットレベルでの詳細解析
  const refBitString = refUnmasked.join('');
  console.log('\\n参考ライブラリビット解析:');
  console.log('最初の20ビット:', refBitString.substring(0, 20));
  console.log('21-40ビット:', refBitString.substring(20, 40));
  console.log('41-60ビット:', refBitString.substring(40, 60));
  
  // 標準エンコーディングとの比較
  console.log('\\n標準エンコーディング:');
  console.log('最初の20ビット:', standardBits.substring(0, 20));
  console.log('21-40ビット:', standardBits.substring(20, 40));
  console.log('41-60ビット:', standardBits.substring(40, 60));
  
  // 一致分析
  let bitMatches = 0;
  const compareLength = Math.min(standardBits.length, refBitString.length);
  for (let i = 0; i < compareLength; i++) {
    if (standardBits[i] === refBitString[i]) {
      bitMatches++;
    }
  }
  
  console.log('\\nビット一致率:', bitMatches, '/', compareLength, '=', (bitMatches/compareLength*100).toFixed(1) + '%');
  
} catch (error) {
  console.error('分析エラー:', error.message);
  console.error(error.stack);
}

function isStructuralModule(row, col, size) {
  // ファインダーパターン領域
  if ((row <= 8 && col <= 8) || 
      (row <= 8 && col >= size - 8) || 
      (row >= size - 8 && col <= 8)) {
    return true;
  }
  
  // タイミングパターン
  if (row === 6 || col === 6) {
    return true;
  }
  
  // フォーマット情報
  if (row === 8 && (col <= 8 || col >= size - 8)) {
    return true;
  }
  if (col === 8 && (row <= 8 || row >= size - 7)) {
    return true;
  }
  
  // ダークモジュール（バージョン3では(21,8)）
  if (row === 21 && col === 8) {
    return true;
  }
  
  // アライメントパターン（バージョン3では(22,22)）
  if (Math.abs(row - 22) <= 2 && Math.abs(col - 22) <= 2) {
    return true;
  }
  
  return false;
}

function getMaskValue(pattern, row, col) {
  switch (pattern) {
    case 0: return ((row + col) % 2) === 0 ? 1 : 0;
    case 1: return (row % 2) === 0 ? 1 : 0;
    case 2: return (col % 3) === 0 ? 1 : 0;
    case 3: return ((row + col) % 3) === 0 ? 1 : 0;
    case 4: return ((Math.floor(row / 2) + Math.floor(col / 3)) % 2) === 0 ? 1 : 0;
    case 5: return (((row * col) % 2) + ((row * col) % 3)) === 0 ? 1 : 0;
    case 6: return ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0 ? 1 : 0;
    case 7: return ((((row + col) % 2) + ((row * col) % 3)) % 2) === 0 ? 1 : 0;
    default: return 0;
  }
}