// 複数の参考ライブラリとの詳細比較分析
import QRCode from 'qrcode';
import QRCodeGenerator from 'qrcode-generator';
import { QRCodeEncoder } from './src/encoder.js';

console.log('=== 複数参考ライブラリ詳細比較分析 ===');

const testUrl = 'https://google.com';

try {
  console.log('1. npmライブラリ(qrcode)の分析...');
  
  const npmQR = QRCode.create(testUrl, { errorCorrectionLevel: 'H' });
  console.log('npmライブラリ(qrcode):');
  console.log('- バージョン:', npmQR.version);
  console.log('- エラー訂正レベル:', npmQR.errorCorrectionLevel.bit);
  console.log('- マスクパターン:', npmQR.maskPattern);
  console.log('- サイズ:', npmQR.modules.size);
  console.log('- セグメントデータ:', Array.from(npmQR.segments[0].data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  console.log('\\n2. qrcode-generatorライブラリの分析...');
  
  const qrGen = QRCodeGenerator(3, 'H'); // バージョン3、エラー訂正レベルH
  qrGen.addData(testUrl);
  qrGen.make();
  
  console.log('qrcode-generator:');
  console.log('- バージョン: 3 (固定指定)');
  console.log('- エラー訂正レベル: H');
  console.log('- モジュール数:', qrGen.getModuleCount());
  
  // qrcode-generatorのモジュールデータ抽出
  const qrGenSize = qrGen.getModuleCount();
  const qrGenMatrix = [];
  for (let row = 0; row < qrGenSize; row++) {
    const rowData = [];
    for (let col = 0; col < qrGenSize; col++) {
      rowData.push(qrGen.isDark(row, col) ? 1 : 0);
    }
    qrGenMatrix.push(rowData);
  }
  
  console.log('\\n3. 我々の実装の分析...');
  
  const encoder = new QRCodeEncoder();
  const encoded = encoder.encode(testUrl, 'H');
  
  console.log('我々の実装:');
  console.log('- バージョン:', encoded.version);
  console.log('- マスクパターン:', encoded.maskPattern);
  console.log('- サイズ:', encoded.size);
  
  console.log('\\n4. 基本情報比較...');
  
  console.log('比較表:');
  console.log('| ライブラリ           | バージョン | サイズ | マスク |');
  console.log('|---------------------|----------|--------|--------|');
  console.log(`| qrcode              | ${npmQR.version}        | ${npmQR.modules.size}     | ${npmQR.maskPattern}      |`);
  console.log(`| qrcode-generator    | 3        | ${qrGenSize}     | ?      |`);
  console.log(`| 我々の実装          | ${encoded.version}        | ${encoded.size}     | ${encoded.maskPattern}      |`);
  
  console.log('\\n5. モジュール配列比較...');
  
  // npmライブラリ(qrcode)のモジュール配列
  const npmSize = npmQR.modules.size;
  const npmModules = npmQR.modules.data;
  const npmMatrix = [];
  for (let row = 0; row < npmSize; row++) {
    const rowData = [];
    for (let col = 0; col < npmSize; col++) {
      rowData.push(npmModules[row * npmSize + col] ? 1 : 0);
    }
    npmMatrix.push(rowData);
  }
  
  // サイズが一致している場合のみ比較
  if (npmSize === qrGenSize && npmSize === encoded.size) {
    console.log('全ライブラリのサイズが一致:', npmSize);
    
    // 我々の実装のモジュール配列
    const ourMatrix = encoded.modules;
    
    // 3つのライブラリの比較
    let npmVsQrGen = 0;
    let npmVsOur = 0;
    let qrGenVsOur = 0;
    let totalModules = npmSize * npmSize;
    
    for (let row = 0; row < npmSize; row++) {
      for (let col = 0; col < npmSize; col++) {
        const npm = npmMatrix[row][col];
        const qrGen = qrGenMatrix[row][col];
        const our = ourMatrix[row][col] ? 1 : 0;
        
        if (npm === qrGen) npmVsQrGen++;
        if (npm === our) npmVsOur++;
        if (qrGen === our) qrGenVsOur++;
      }
    }
    
    console.log('\\n相互一致率:');
    console.log(`qrcode vs qrcode-generator: ${npmVsQrGen}/${totalModules} = ${(npmVsQrGen/totalModules*100).toFixed(1)}%`);
    console.log(`qrcode vs 我々の実装: ${npmVsOur}/${totalModules} = ${(npmVsOur/totalModules*100).toFixed(1)}%`);
    console.log(`qrcode-generator vs 我々の実装: ${qrGenVsOur}/${totalModules} = ${(qrGenVsOur/totalModules*100).toFixed(1)}%`);
    
    // 最も一致率の高いライブラリを特定
    console.log('\\n6. データ領域のみの比較...');
    
    let npmVsQrGenData = 0;
    let npmVsOurData = 0;
    let qrGenVsOurData = 0;
    let dataModules = 0;
    
    for (let row = 0; row < npmSize; row++) {
      for (let col = 0; col < npmSize; col++) {
        if (!isStructuralModule(row, col, npmSize)) {
          const npm = npmMatrix[row][col];
          const qrGen = qrGenMatrix[row][col];
          const our = ourMatrix[row][col] ? 1 : 0;
          
          if (npm === qrGen) npmVsQrGenData++;
          if (npm === our) npmVsOurData++;
          if (qrGen === our) qrGenVsOurData++;
          dataModules++;
        }
      }
    }
    
    console.log('データ領域一致率:');
    console.log(`qrcode vs qrcode-generator: ${npmVsQrGenData}/${dataModules} = ${(npmVsQrGenData/dataModules*100).toFixed(1)}%`);
    console.log(`qrcode vs 我々の実装: ${npmVsOurData}/${dataModules} = ${(npmVsOurData/dataModules*100).toFixed(1)}%`);
    console.log(`qrcode-generator vs 我々の実装: ${qrGenVsOurData}/${dataModules} = ${(qrGenVsOurData/dataModules*100).toFixed(1)}%`);
    
    // 最も一致率の高いペアを特定
    const bestMatch = Math.max(npmVsQrGenData, npmVsOurData, qrGenVsOurData);
    let bestPair = '';
    
    if (bestMatch === npmVsQrGenData) {
      bestPair = 'qrcode と qrcode-generator';
    } else if (bestMatch === npmVsOurData) {
      bestPair = 'qrcode と 我々の実装';
    } else {
      bestPair = 'qrcode-generator と 我々の実装';
    }
    
    console.log(`\\n最も高い一致率: ${bestPair} (${(bestMatch/dataModules*100).toFixed(1)}%)`);
    
    console.log('\\n7. 各ライブラリの最初の数行の詳細パターン...');
    
    for (let row = 0; row < Math.min(5, npmSize); row++) {
      console.log(`\\n行${row}:`);
      console.log('qrcode         :', npmMatrix[row].join(''));
      console.log('qrcode-generator:', qrGenMatrix[row].join(''));
      console.log('我々の実装      :', ourMatrix[row].map(m => m ? '1' : '0').join(''));
    }
    
    console.log('\\n8. qrcode-generatorとの差異分析...');
    
    // qrcode-generatorと我々の実装の差異を詳細分析
    if (qrGenVsOurData > npmVsOurData) {
      console.log('qrcode-generatorの方が我々の実装により近いです。');
      console.log('qrcode-generatorの実装を参考にすべきです。');
      
      // qrcode-generatorとの差異詳細
      const differences = [];
      for (let row = 0; row < npmSize; row++) {
        for (let col = 0; col < npmSize; col++) {
          if (!isStructuralModule(row, col, npmSize)) {
            const qrGen = qrGenMatrix[row][col];
            const our = ourMatrix[row][col] ? 1 : 0;
            
            if (qrGen !== our) {
              differences.push({
                row, col,
                qrGen, our
              });
            }
          }
        }
      }
      
      console.log('\\nqrcode-generatorとの差異（最初の20個）:');
      differences.slice(0, 20).forEach((diff, idx) => {
        console.log(`差異${idx+1}: (${diff.row},${diff.col}) qrcode-generator=${diff.qrGen}, 我々=${diff.our}`);
      });
    }
    
  } else {
    console.log('サイズが一致しません:');
    console.log('npm:', npmSize, 'qrcode-generator:', qrGenSize, '我々:', encoded.size);
  }
  
} catch (error) {
  console.error('比較エラー:', error.message);
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