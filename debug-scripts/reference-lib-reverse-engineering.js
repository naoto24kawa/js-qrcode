// 参考ライブラリ（qrcode npm）の正確な処理手順を逆解析
import QRCode from 'qrcode';

console.log('=== 参考ライブラリ逆解析 ===');

const testUrl = 'https://google.com';

try {
  // 1. 参考ライブラリの中間データにアクセス
  console.log('1. 参考ライブラリの処理過程分析...');
  
  const refQR = QRCode.create(testUrl, { errorCorrectionLevel: 'H' });
  
  console.log('基本情報:');
  console.log('- バージョン:', refQR.version);
  console.log('- エラー訂正レベル:', refQR.errorCorrectionLevel.bit);
  console.log('- マスクパターン:', refQR.maskPattern);
  
  // 2. セグメント詳細分析
  console.log('\\n2. セグメント詳細分析...');
  
  const segment = refQR.segments[0];
  console.log('セグメント情報:');
  console.log('- モード:', segment.mode.id, '(bit:', segment.mode.bit + ')');
  console.log('- データ配列:', Array.from(segment.data));
  console.log('- データ長:', segment.data.length);
  
  // 3. 参考ライブラリの内部プロパティ探索
  console.log('\\n3. 内部プロパティ探索...');
  
  console.log('QRオブジェクトのプロパティ:', Object.getOwnPropertyNames(refQR));
  console.log('セグメントのプロパティ:', Object.getOwnPropertyNames(segment));
  console.log('モードのプロパティ:', Object.getOwnPropertyNames(segment.mode));
  
  // 4. modules配列の詳細分析
  console.log('\\n4. modules配列の詳細分析...');
  
  console.log('modules size:', refQR.modules.size);
  console.log('modules data type:', typeof refQR.modules.data);
  console.log('modules data length:', refQR.modules.data.length);
  console.log('modules data constructor:', refQR.modules.data.constructor.name);
  
  if (refQR.modules.reservedBit) {
    console.log('reserved bit array length:', refQR.modules.reservedBit.length);
  }
  
  // 5. 参考ライブラリが生成する実際のデータビット抽出試行
  console.log('\\n5. 参考ライブラリの実際のデータビット抽出...');
  
  // モジュール配列から構造パターンを除いたデータ部分のみ抽出
  const size = refQR.modules.size;
  const modules = refQR.modules.data;
  
  const dataBits = [];
  let bitIndex = 0;
  
  // QR仕様のデータ配置順序で抽出
  let direction = -1;
  
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // タイミングパターンをスキップ
    
    for (let i = 0; i < size; i++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = direction === -1 ? size - 1 - i : i;
        
        if (!isStructuralModule(y, x, size)) {
          const moduleIndex = y * size + x;
          const bitValue = modules[moduleIndex] ? 1 : 0;
          dataBits.push(bitValue);
          bitIndex++;
        }
      }
    }
    direction = -direction;
  }
  
  console.log('抽出データビット数:', dataBits.length);
  console.log('最初の40ビット:', dataBits.slice(0, 40).join(''));
  
  // 6. ビット列をバイト配列に変換
  console.log('\\n6. ビット列のバイト変換...');
  
  const extractedBytes = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    const byteBits = dataBits.slice(i, i + 8);
    if (byteBits.length === 8) {
      const byteValue = parseInt(byteBits.join(''), 2);
      extractedBytes.push(byteValue);
    }
  }
  
  console.log('抽出バイト数:', extractedBytes.length);
  console.log('最初の20バイト:', extractedBytes.slice(0, 20).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  // 7. URLバイトとの比較
  console.log('\\n7. URLバイトとの比較...');
  
  const urlBytes = Array.from(new TextEncoder().encode(testUrl));
  console.log('URL UTF-8バイト:', urlBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('セグメントデータ:', Array.from(segment.data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  // URLバイトとセグメントデータの一致確認
  const segmentBytes = Array.from(segment.data);
  const urlMatch = urlBytes.every((b, i) => b === segmentBytes[i]);
  console.log('URL↔セグメント一致:', urlMatch);
  
  // 8. マスク解除試行
  console.log('\\n8. マスク解除試行...');
  
  const maskPattern = refQR.maskPattern;
  console.log('マスクパターン:', maskPattern);
  
  const unmaskedBits = [];
  let dataIndex = 0;
  direction = -1;
  
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    
    for (let i = 0; i < size; i++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = direction === -1 ? size - 1 - i : i;
        
        if (!isStructuralModule(y, x, size)) {
          const maskedBit = dataBits[dataIndex];
          const maskValue = getMaskValue(maskPattern, y, x);
          const originalBit = maskedBit ^ maskValue;
          unmaskedBits.push(originalBit);
          dataIndex++;
        }
      }
    }
    direction = -direction;
  }
  
  console.log('マスク解除後の最初の40ビット:', unmaskedBits.slice(0, 40).join(''));
  
  // マスク解除後のバイト変換
  const unmaskedBytes = [];
  for (let i = 0; i < unmaskedBits.length; i += 8) {
    const byteBits = unmaskedBits.slice(i, i + 8);
    if (byteBits.length === 8) {
      const byteValue = parseInt(byteBits.join(''), 2);
      unmaskedBytes.push(byteValue);
    }
  }
  
  console.log('マスク解除後の最初の20バイト:', unmaskedBytes.slice(0, 20).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
} catch (error) {
  console.error('逆解析エラー:', error.message);
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