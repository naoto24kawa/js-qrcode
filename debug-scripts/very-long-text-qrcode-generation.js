// 100文字以上の非常に長いテキストでqrcode-generatorと完全一致するQRコード生成
import QRCodeGenerator from 'qrcode-generator';

console.log('=== 100文字以上の非常に長いテキストQRコード生成 ===');

// 100文字以上のテストテキスト
const veryLongText = 'https://example.com/api/v1/users/12345/profile/detailed-information-with-complex-parameters?include=personal,contact,preferences&format=json&callback=processUserData&timestamp=1640995200&token=abc123xyz789&debug=true';

console.log('テストテキスト:', veryLongText);
console.log('文字数:', veryLongText.length);

try {
  console.log('\\n1. qrcode-generatorでの自動バージョン選択確認...');
  
  // qrcode-generatorがどのバージョンを選択するか確認
  const qrGenAuto = QRCodeGenerator(0, 'Q'); // バージョン0で自動選択
  qrGenAuto.addData(veryLongText);
  qrGenAuto.make();
  
  const autoSize = qrGenAuto.getModuleCount();
  const autoVersion = getVersionFromSize(autoSize);
  
  console.log('qrcode-generator自動選択:');
  console.log('- バージョン:', autoVersion);
  console.log('- サイズ:', autoSize + 'x' + autoSize);
  
  console.log('\\n2. 各エラー訂正レベルでのバージョン確認...');
  
  const levels = ['L', 'M', 'Q', 'H'];
  const versionResults = {};
  
  for (const level of levels) {
    try {
      const qrTest = QRCodeGenerator(0, level);
      qrTest.addData(veryLongText);
      qrTest.make();
      
      const testSize = qrTest.getModuleCount();
      const testVersion = getVersionFromSize(testSize);
      
      versionResults[level] = {
        version: testVersion,
        size: testSize
      };
      
      console.log(`エラー訂正${level}: バージョン${testVersion} (${testSize}x${testSize})`);
    } catch (e) {
      console.log(`エラー訂正${level}: エラー - ${e.message}`);
    }
  }
  
  console.log('\\n3. 推奨バージョンでの完全一致QRコード生成...');
  
  // エラー訂正レベルQでの生成（前回成功したレベル）
  const targetLevel = 'Q';
  const targetVersion = versionResults[targetLevel].version;
  const targetSize = versionResults[targetLevel].size;
  
  console.log(`目標: エラー訂正${targetLevel}, バージョン${targetVersion}`);
  console.log(`サイズ: ${targetSize}x${targetSize}`);
  
  // バージョンが高すぎる場合は警告
  if (targetVersion > 10) {
    console.log('⚠️ 非常に高いバージョンです。QRコードが複雑になります。');
  }
  
  // qrcode-generatorの参考QRコード生成
  const qrGenRef = QRCodeGenerator(targetVersion, targetLevel);
  qrGenRef.addData(veryLongText);
  qrGenRef.make();
  
  console.log('4. qrcode-generatorマトリックス抽出...');
  
  const qrGenMatrix = [];
  for (let row = 0; row < targetSize; row++) {
    const rowData = [];
    for (let col = 0; col < targetSize; col++) {
      rowData.push(qrGenRef.isDark(row, col) ? 1 : 0);
    }
    qrGenMatrix.push(rowData);
  }
  
  console.log('5. qrcode-generatorデータ抽出...');
  
  // データ領域のビット抽出
  const dataBits = [];
  const dataPositions = [];
  let direction = -1;
  let bitIndex = 0;
  
  for (let col = targetSize - 1; col > 0; col -= 2) {
    if (col === 6) col--; // タイミングパターンスキップ
    
    for (let i = 0; i < targetSize; i++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = direction === -1 ? targetSize - 1 - i : i;
        
        if (!isStructuralModule(y, x, targetSize, targetVersion)) {
          dataBits.push(qrGenMatrix[y][x]);
          dataPositions.push({ row: y, col: x, index: bitIndex });
          bitIndex++;
        }
      }
    }
    direction = -direction;
  }
  
  console.log('データビット数:', dataBits.length);
  
  // フォーマット情報抽出
  const formatBits = extractFormatInfo(qrGenMatrix, targetSize);
  const formatValue = parseInt(formatBits.join(''), 2);
  const unmaskedFormat = formatValue ^ 0x5412;
  const maskPattern = unmaskedFormat & 0x07;
  
  console.log('抽出されたマスクパターン:', maskPattern);
  
  // マスク解除してバイト配列抽出
  const unmaskedBits = [];
  for (let i = 0; i < dataBits.length; i++) {
    const pos = dataPositions[i];
    const maskValue = getMaskValue(maskPattern, pos.row, pos.col);
    const unmaskedBit = dataBits[i] ^ maskValue;
    unmaskedBits.push(unmaskedBit);
  }
  
  // バイト配列に変換
  const extractedBytes = [];
  for (let i = 0; i < unmaskedBits.length; i += 8) {
    if (i + 8 <= unmaskedBits.length) {
      let byteValue = 0;
      for (let j = 0; j < 8; j++) {
        byteValue = (byteValue << 1) | unmaskedBits[i + j];
      }
      extractedBytes.push(byteValue);
    }
  }
  
  console.log('抽出バイト数:', extractedBytes.length);
  console.log('最初の30バイト:', extractedBytes.slice(0, 30).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
  
  console.log('\\n6. 完全一致QRコード生成...');
  
  // 完全一致SVG生成
  const perfectSvg = generatePerfectSVGFromMatrix(qrGenMatrix, targetSize);
  
  const fs = await import('fs');
  fs.writeFileSync('./very-long-text-perfect-qrcode.svg', perfectSvg);
  console.log('✅ 非常に長いテキストの完全一致QRコードをvery-long-text-perfect-qrcode.svgに保存しました');
  
  // qrcode-generator参考SVGも保存
  const qrGenSvg = qrGenRef.createSvgTag({
    cellSize: 10,
    margin: 6
  });
  fs.writeFileSync('./very-long-text-qrcode-generator-reference.svg', qrGenSvg);
  console.log('✅ qrcode-generator参考SVGをvery-long-text-qrcode-generator-reference.svgに保存しました');
  
  console.log('\\n📊 結果:');
  console.log('テキスト:', veryLongText.substring(0, 100) + '...');
  console.log('文字数:', veryLongText.length);
  console.log('バージョン:', targetVersion);
  console.log('エラー訂正レベル:', targetLevel);
  console.log('マスクパターン:', maskPattern);
  console.log('サイズ:', targetSize + 'x' + targetSize);
  console.log('データ容量:', extractedBytes.length + 'バイト');
  
  // QRコードの複雑さ評価
  const complexity = getComplexityRating(targetVersion, targetSize);
  console.log('複雑さ評価:', complexity);
  
  console.log('\\n📱 very-long-text-perfect-qrcode.svgをスマートフォンでテストしてください！');
  console.log('💡 非常に大きなQRコードのため、スマートフォンを適切な距離に調整して読み取ってください。');
  
} catch (error) {
  console.error('非常に長いテキストQRコード生成エラー:', error.message);
  console.error(error.stack);
}

function getVersionFromSize(size) {
  // QRコードサイズからバージョンを逆算
  // サイズ = 21 + (バージョン - 1) * 4
  return Math.floor((size - 21) / 4) + 1;
}

function getComplexityRating(version, size) {
  if (version <= 3) return '簡単 (小さなQRコード)';
  if (version <= 6) return '標準 (中サイズのQRコード)';
  if (version <= 10) return '複雑 (大きなQRコード)';
  return '非常に複雑 (極大QRコード)';
}

function isStructuralModule(row, col, size, version) {
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
  
  // ダークモジュール
  if (version >= 2 && row === 4 * version + 9 && col === 8) {
    return true;
  }
  
  // アライメントパターン（バージョン2以上）
  if (version >= 2) {
    const alignmentPositions = getAlignmentPositions(version);
    for (const pos of alignmentPositions) {
      if (Math.abs(row - pos) <= 2 && Math.abs(col - pos) <= 2) {
        return true;
      }
    }
  }
  
  // バージョン情報（バージョン7以上）
  if (version >= 7) {
    // バージョン情報は複雑なので簡略化
    if ((row < 6 && col >= size - 11) || (col < 6 && row >= size - 11)) {
      return true;
    }
  }
  
  return false;
}

function getAlignmentPositions(version) {
  // バージョンごとのアライメントパターン位置
  const alignmentTable = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50]
  };
  
  return alignmentTable[version] || [6, 6 + 4 * version];
}

function extractFormatInfo(matrix, size) {
  const formatBits = [];
  
  // フォーマット情報の位置（行8, 列0-5, 7-8）
  for (let col = 0; col <= 5; col++) {
    formatBits.push(matrix[8][col]);
  }
  formatBits.push(matrix[8][7]);
  formatBits.push(matrix[8][8]);
  
  // フォーマット情報の位置（列8, 行7-0）
  for (let row = 7; row >= 0; row--) {
    formatBits.push(matrix[row][8]);
  }
  
  return formatBits;
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

function generatePerfectSVGFromMatrix(matrix, size) {
  const margin = 6;
  const cellSize = 10;
  const totalSize = (size * cellSize) + (margin * 2 * cellSize);
  
  let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${totalSize}px" height="${totalSize}px" viewBox="0 0 ${totalSize} ${totalSize}" preserveAspectRatio="xMinYMin meet">`;
  
  // 背景（白）
  svg += `<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>`;
  
  // 黒いモジュールを矩形で描画
  let pathData = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) {
        const x = (margin * cellSize) + (col * cellSize);
        const y = (margin * cellSize) + (row * cellSize);
        pathData += `M${x},${y}l${cellSize},0 0,${cellSize} -${cellSize},0 0,-${cellSize}z `;
      }
    }
  }
  
  if (pathData) {
    svg += `<path d="${pathData}" stroke="transparent" fill="black"/>`;
  }
  
  svg += '</svg>';
  return svg;
}