import { QRCode } from './dist/js-qrcode.esm.js';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

console.log('=== ダウンロードされたPNG QRコードの詳細分析 ===');

async function analyzePNGQR() {
  try {
    const imagePath = '/Users/nishikawa/Downloads/qrcode_1752935692036.png';
    
    // 画像をCanvasで読み込み
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    console.log(`画像サイズ: ${image.width} x ${image.height}`);
    
    // 画像をCanvasに描画
    ctx.drawImage(image, 0, 0);
    
    // ImageDataを取得
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    
    console.log('=== QRコード構造分析 ===');
    
    // 1. 基本構造の確認
    console.log('\n1. 基本構造チェック:');
    analyzeBasicStructure(imageData);
    
    // 2. モジュールサイズと解像度の分析
    console.log('\n2. モジュールサイズと解像度:');
    analyzeModuleSize(imageData);
    
    // 3. クワイエットゾーンの確認
    console.log('\n3. クワイエットゾーン分析:');
    analyzeQuietZone(imageData);
    
    // 4. ファインダーパターンの分析
    console.log('\n4. ファインダーパターン分析:');
    analyzeFinderPatterns(imageData);
    
    // 5. コントラストと視認性
    console.log('\n5. コントラストと視認性:');
    analyzeContrast(imageData);
    
    // 6. デコード試行
    console.log('\n6. デコード試行:');
    try {
      const result = await QRCode.decode(imageData);
      if (result) {
        console.log(`✓ デコード成功: "${result}"`);
      } else {
        console.log('✗ デコード失敗');
      }
    } catch (error) {
      console.log(`✗ デコードエラー: ${error.message}`);
    }
    
    // 7. 詳細なピクセル分析
    console.log('\n7. 詳細ピクセル分析:');
    analyzePixelDetails(imageData);
    
  } catch (error) {
    console.error('分析エラー:', error);
  }
}

function analyzeBasicStructure(imageData) {
  const { width, height, data } = imageData;
  
  // グレースケール変換とバイナリ化
  const binary = convertToBinary(imageData);
  
  // QRコードの推定サイズを計算
  const qrBounds = findQRBounds(binary, width, height);
  if (qrBounds) {
    const qrWidth = qrBounds.right - qrBounds.left;
    const qrHeight = qrBounds.bottom - qrBounds.top;
    console.log(`- QRコード領域: ${qrWidth} x ${qrHeight} ピクセル`);
    
    // バージョン推定
    const estimatedModules = Math.round(Math.sqrt(qrWidth * qrHeight) / 10);
    const version = Math.round((estimatedModules - 17) / 4);
    console.log(`- 推定モジュール数: ${estimatedModules} x ${estimatedModules}`);
    console.log(`- 推定バージョン: ${version}`);
  } else {
    console.log('- QRコード領域が検出できませんでした');
  }
}

function analyzeModuleSize(imageData) {
  const { width, height } = imageData;
  const binary = convertToBinary(imageData);
  
  // 水平方向のモジュールサイズを推定
  const horizontalTransitions = [];
  const midRow = Math.floor(height / 2);
  
  for (let x = 1; x < width; x++) {
    const current = binary[midRow * width + x];
    const previous = binary[midRow * width + (x - 1)];
    if (current !== previous) {
      horizontalTransitions.push(x);
    }
  }
  
  if (horizontalTransitions.length > 1) {
    const distances = [];
    for (let i = 1; i < horizontalTransitions.length; i++) {
      distances.push(horizontalTransitions[i] - horizontalTransitions[i - 1]);
    }
    
    const avgModuleSize = distances.reduce((a, b) => a + b, 0) / distances.length;
    console.log(`- 推定モジュールサイズ: ${avgModuleSize.toFixed(2)} ピクセル`);
    
    if (avgModuleSize < 3) {
      console.log('⚠️ モジュールサイズが小さすぎます（推奨: 3ピクセル以上）');
    } else if (avgModuleSize >= 3) {
      console.log('✓ モジュールサイズは適切です');
    }
  }
}

function analyzeQuietZone(imageData) {
  const { width, height } = imageData;
  const binary = convertToBinary(imageData);
  
  // QRコードの境界を検出
  const qrBounds = findQRBounds(binary, width, height);
  if (!qrBounds) {
    console.log('- QRコード境界が検出できないため、クワイエットゾーンを分析できません');
    return;
  }
  
  const leftQuietZone = qrBounds.left;
  const rightQuietZone = width - qrBounds.right;
  const topQuietZone = qrBounds.top;
  const bottomQuietZone = height - qrBounds.bottom;
  
  console.log(`- 左側クワイエットゾーン: ${leftQuietZone} ピクセル`);
  console.log(`- 右側クワイエットゾーン: ${rightQuietZone} ピクセル`);
  console.log(`- 上側クワイエットゾーン: ${topQuietZone} ピクセル`);
  console.log(`- 下側クワイエットゾーン: ${bottomQuietZone} ピクセル`);
  
  const minQuietZone = Math.min(leftQuietZone, rightQuietZone, topQuietZone, bottomQuietZone);
  if (minQuietZone < 10) {
    console.log('⚠️ クワイエットゾーンが不足しています（推奨: 4モジュール分以上）');
  } else {
    console.log('✓ クワイエットゾーンは適切です');
  }
}

function analyzeFinderPatterns(imageData) {
  const { width, height } = imageData;
  const binary = convertToBinary(imageData);
  
  // ファインダーパターンを検索
  const finderPatterns = findFinderPatterns(binary, width, height);
  
  console.log(`- 検出されたファインダーパターン数: ${finderPatterns.length}`);
  
  if (finderPatterns.length === 3) {
    console.log('✓ 3つのファインダーパターンが正しく検出されました');
    
    // パターンの配置を確認
    finderPatterns.forEach((pattern, index) => {
      console.log(`  パターン${index + 1}: (${pattern.x}, ${pattern.y})`);
    });
  } else if (finderPatterns.length < 3) {
    console.log('✗ ファインダーパターンが不足しています');
    console.log('  原因: コントラスト不足、ノイズ、または破損');
  } else {
    console.log('⚠️ 過剰なファインダーパターンが検出されました');
    console.log('  原因: ノイズまたは重複検出');
  }
}

function analyzeContrast(imageData) {
  const { width, height, data } = imageData;
  
  let minBrightness = 255;
  let maxBrightness = 0;
  let totalBrightness = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    totalBrightness += brightness;
  }
  
  const avgBrightness = totalBrightness / (data.length / 4);
  const contrast = maxBrightness - minBrightness;
  
  console.log(`- 最小輝度: ${minBrightness.toFixed(1)}`);
  console.log(`- 最大輝度: ${maxBrightness.toFixed(1)}`);
  console.log(`- 平均輝度: ${avgBrightness.toFixed(1)}`);
  console.log(`- コントラスト: ${contrast.toFixed(1)}`);
  
  if (contrast < 128) {
    console.log('⚠️ コントラストが低いです（推奨: 128以上）');
  } else {
    console.log('✓ コントラストは適切です');
  }
}

function analyzePixelDetails(imageData) {
  const { width, height } = imageData;
  const binary = convertToBinary(imageData);
  
  // エッジの鮮明さを分析
  let edgeTransitions = 0;
  let blurryTransitions = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const current = binary[y * width + x];
      const neighbors = [
        binary[(y - 1) * width + x],
        binary[y * width + (x - 1)],
        binary[y * width + (x + 1)],
        binary[(y + 1) * width + x]
      ];
      
      const differentNeighbors = neighbors.filter(n => n !== current).length;
      if (differentNeighbors > 0) {
        edgeTransitions++;
        if (differentNeighbors > 2) {
          blurryTransitions++;
        }
      }
    }
  }
  
  const blurRatio = blurryTransitions / edgeTransitions;
  console.log(`- エッジ遷移数: ${edgeTransitions}`);
  console.log(`- ぼやけた遷移数: ${blurryTransitions}`);
  console.log(`- ぼやけ比率: ${(blurRatio * 100).toFixed(1)}%`);
  
  if (blurRatio > 0.3) {
    console.log('⚠️ 画像がぼやけています（スマートフォンでの読み取りが困難）');
  } else {
    console.log('✓ エッジは鮮明です');
  }
}

// ユーティリティ関数
function convertToBinary(imageData) {
  const { width, height, data } = imageData;
  const binary = new Array(width * height);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = (r + g + b) / 3;
    binary[i / 4] = gray < 128 ? 1 : 0; // 黒=1, 白=0
  }
  
  return binary;
}

function findQRBounds(binary, width, height) {
  let left = width, right = 0, top = height, bottom = 0;
  let found = false;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 1) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        found = true;
      }
    }
  }
  
  return found ? { left, right, top, bottom } : null;
}

function findFinderPatterns(binary, width, height) {
  const patterns = [];
  
  // 簡略化されたファインダーパターン検出
  // 7x7の黒白黒白黒パターンを検索
  for (let y = 0; y <= height - 7; y++) {
    for (let x = 0; x <= width - 7; x++) {
      if (isFinderPattern(binary, x, y, width)) {
        patterns.push({ x: x + 3, y: y + 3 });
      }
    }
  }
  
  // 重複除去
  return removeDuplicatePatterns(patterns);
}

function isFinderPattern(binary, startX, startY, width) {
  // 簡略化されたファインダーパターンチェック
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
  ];
  
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      const expected = pattern[dy][dx];
      const actual = binary[(startY + dy) * width + (startX + dx)];
      if (actual !== expected) {
        return false;
      }
    }
  }
  
  return true;
}

function removeDuplicatePatterns(patterns) {
  const filtered = [];
  const minDistance = 15;
  
  for (const pattern of patterns) {
    let isDuplicate = false;
    for (const existing of filtered) {
      const distance = Math.sqrt(
        Math.pow(pattern.x - existing.x, 2) + 
        Math.pow(pattern.y - existing.y, 2)
      );
      if (distance < minDistance) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      filtered.push(pattern);
    }
  }
  
  return filtered.slice(0, 3);
}

analyzePNGQR().catch(console.error);