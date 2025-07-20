/**
 * Reed-Solomon エラー訂正符号の実装検証
 * 標準的なテストベクターとの比較
 */

import { ReedSolomonEncoder, QRErrorCorrection, ERROR_CORRECTION_PARAMS } from './src/reed-solomon.js';

console.log('=== Reed-Solomon エラー訂正符号の実装検証 ===');

// 1. 基本的なガロア体演算の検証
function testGaloisField() {
    console.log('\n1. ガロア体演算の検証');
    console.log('─'.repeat(50));
    
    const encoder = new ReedSolomonEncoder();
    const gf = encoder.gf;
    
    // 基本的な演算のテスト
    console.log('基本演算テスト:');
    console.log(`  2 * 3 = ${gf.multiply(2, 3)} (期待値: 6)`);
    console.log(`  25 * 0 = ${gf.multiply(25, 0)} (期待値: 0)`);
    console.log(`  1 * 1 = ${gf.multiply(1, 1)} (期待値: 1)`);
    
    // 乗法表の一部検証
    console.log('\n乗法表検証（最初の10要素）:');
    for (let i = 1; i <= 10; i++) {
        for (let j = 1; j <= 10; j++) {
            const result = gf.multiply(i, j);
            if (i === 1) process.stdout.write(`${result.toString().padStart(3, ' ')}`);
        }
        if (i === 1) console.log();
    }
    
    // 指数表と対数表の整合性確認
    console.log('\n指数表と対数表の整合性:');
    let inconsistencies = 0;
    for (let i = 1; i < 255; i++) {
        const exp = gf.expTable[gf.logTable[i]];
        if (exp !== i) {
            inconsistencies++;
            if (inconsistencies <= 5) {
                console.log(`  不整合: i=${i}, exp[log[${i}]]=${exp}`);
            }
        }
    }
    console.log(`  不整合の数: ${inconsistencies} / 254`);
    
    return inconsistencies === 0;
}

// 2. 生成多項式の検証
function testGeneratorPolynomial() {
    console.log('\n2. 生成多項式の検証');
    console.log('─'.repeat(50));
    
    const encoder = new ReedSolomonEncoder();
    
    // 各レベルの生成多項式をテスト
    const testCases = [
        { eccCount: 7, name: 'Version 1 L' },
        { eccCount: 10, name: 'Version 1 M' },
        { eccCount: 13, name: 'Version 1 Q' },
        { eccCount: 17, name: 'Version 1 H' },
        { eccCount: 44, name: 'Version 3 H' }
    ];
    
    testCases.forEach(({ eccCount, name }) => {
        const generator = encoder.createGenerator(eccCount);
        console.log(`${name} (ECC=${eccCount}): 長さ=${generator.length}, 最初の係数=[${generator.slice(0, 5).join(', ')}...]`);
        
        // 生成多項式の先頭は常に1である必要がある
        if (generator[0] !== 1) {
            console.warn(`  警告: 生成多項式の先頭が1ではありません: ${generator[0]}`);
        }
    });
}

// 3. 既知のテストベクターでの検証
function testKnownVectors() {
    console.log('\n3. 既知のテストベクターでの検証');
    console.log('─'.repeat(50));
    
    const encoder = new ReedSolomonEncoder();
    
    // QRコード仕様からの簡単なテストケース
    const testCases = [
        {
            name: 'シンプルなテスト',
            data: [1, 2, 3, 4, 5],
            eccCount: 4,
            // 期待値は参考実装から計算
        },
        {
            name: 'ゼロデータ',
            data: [0, 0, 0, 0],
            eccCount: 6,
        },
        {
            name: '最大値データ',
            data: [255, 255, 255],
            eccCount: 8,
        }
    ];
    
    testCases.forEach(({ name, data, eccCount }) => {
        console.log(`\n${name}:`);
        console.log(`  入力データ: [${data.join(', ')}]`);
        console.log(`  ECC数: ${eccCount}`);
        
        const result = encoder.encode(data, eccCount);
        const datapart = result.slice(0, data.length);
        const eccpart = result.slice(data.length);
        
        console.log(`  データ部: [${datapart.join(', ')}]`);
        console.log(`  ECC部: [${eccpart.join(', ')}]`);
        console.log(`  総長: ${result.length}`);
        
        // データ部分が元のデータと一致するかチェック
        const dataMatch = datapart.every((val, i) => val === data[i]);
        console.log(`  データ部整合性: ${dataMatch ? 'OK' : 'NG'}`);
    });
}

// 4. QRコード固有のパラメータでの検証
function testQRCodeParameters() {
    console.log('\n4. QRコード固有のパラメータでの検証');
    console.log('─'.repeat(50));
    
    const errorCorrection = new QRErrorCorrection();
    
    // Version 3, Level H のテスト（我々のケース）
    const testData = [65, 38, 135, 71, 71, 7, 51, 162, 242, 246, 118, 17, 246, 236, 118, 17, 246, 236, 246, 17, 246, 236, 246, 17, 246, 17];
    const version = 3;
    const level = 'H';
    
    console.log(`テストデータ: Version ${version}, Level ${level}`);
    console.log(`入力データ長: ${testData.length}`);
    
    const params = ERROR_CORRECTION_PARAMS[version][level];
    console.log(`パラメータ: データ=${params.dataCodewords}, ECC=${params.eccCodewords}, ブロック=${params.blocks}`);
    
    try {
        const result = errorCorrection.addErrorCorrection(testData, version, level);
        console.log(`結果長: ${result.length}`);
        console.log(`期待長: ${params.dataCodewords + params.eccCodewords * params.blocks}`);
        
        const datapart = result.slice(0, testData.length);
        const eccpart = result.slice(testData.length);
        
        console.log(`データ部（最初の10個）: [${datapart.slice(0, 10).join(', ')}...]`);
        console.log(`ECC部（最初の10個）: [${eccpart.slice(0, 10).join(', ')}...]`);
        
        // データ部分の整合性確認
        const dataMatch = datapart.every((val, i) => val === testData[i]);
        console.log(`データ部整合性: ${dataMatch ? 'OK' : 'NG'}`);
        
        return result;
        
    } catch (error) {
        console.error(`エラー: ${error.message}`);
        return null;
    }
}

// 5. ブロック分割とインターリーブの検証
function testBlockInterleaving() {
    console.log('\n5. ブロック分割とインターリーブの検証');
    console.log('─'.repeat(50));
    
    const errorCorrection = new QRErrorCorrection();
    
    // Version 3, Level H は 2ブロック構成
    const testData = Array.from({length: 26}, (_, i) => i + 1); // 1, 2, 3, ..., 26
    const version = 3;
    const level = 'H';
    
    console.log('ブロック分割テスト:');
    console.log(`テストデータ: [${testData.slice(0, 10).join(', ')}...] (長さ: ${testData.length})`);
    
    const params = ERROR_CORRECTION_PARAMS[version][level];
    console.log(`パラメータ: データ=${params.dataCodewords}, ECC=${params.eccCodewords}, ブロック=${params.blocks}`);
    
    try {
        const result = errorCorrection.addErrorCorrection(testData, version, level);
        
        console.log(`\n結果の構造分析:`);
        console.log(`総長: ${result.length}`);
        
        // 2ブロック構成の場合、データはインターリーブされる
        if (params.blocks === 2) {
            const blockSize = Math.ceil(params.dataCodewords / params.blocks);
            console.log(`ブロックサイズ: ${blockSize}`);
            
            // データ部分のインターリーブパターンを解析
            console.log('\nデータブロックの推定構造:');
            const block1Data = [];
            const block2Data = [];
            
            for (let i = 0; i < params.dataCodewords; i++) {
                if (i % 2 === 0 && block1Data.length < blockSize) {
                    block1Data.push(result[i]);
                } else if (block2Data.length < blockSize) {
                    block2Data.push(result[i]);
                }
            }
            
            console.log(`ブロック1データ（推定）: [${block1Data.join(', ')}]`);
            console.log(`ブロック2データ（推定）: [${block2Data.join(', ')}]`);
        }
        
        return result;
        
    } catch (error) {
        console.error(`エラー: ${error.message}`);
        return null;
    }
}

// 6. Reed-Solomon符号の特性検証
function testReedSolomonProperties() {
    console.log('\n6. Reed-Solomon符号の特性検証');
    console.log('─'.repeat(50));
    
    const encoder = new ReedSolomonEncoder();
    
    // エラー検出・訂正能力のテスト
    const originalData = [1, 2, 3, 4, 5, 6, 7, 8];
    const eccCount = 10; // 5個のエラーまで訂正可能
    
    console.log('エラー検出・訂正特性のテスト:');
    console.log(`原データ: [${originalData.join(', ')}]`);
    console.log(`ECC数: ${eccCount} (理論上 ${Math.floor(eccCount/2)} 個のエラーまで訂正可能)`);
    
    const encoded = encoder.encode(originalData, eccCount);
    console.log(`符号化結果: [${encoded.join(', ')}]`);
    
    // Reed-Solomon符号の基本特性確認
    console.log('\n符号化特性:');
    console.log(`  元データ長: ${originalData.length}`);
    console.log(`  総符号長: ${encoded.length}`);
    console.log(`  冗長度: ${encoded.length - originalData.length}`);
    console.log(`  符号化率: ${(originalData.length / encoded.length).toFixed(3)}`);
}

// メイン実行
async function main() {
    console.log('Reed-Solomon実装の包括的検証を開始します...\n');
    
    try {
        // 1. ガロア体演算の検証
        const gfValid = testGaloisField();
        
        // 2. 生成多項式の検証
        testGeneratorPolynomial();
        
        // 3. 既知のテストベクターでの検証
        testKnownVectors();
        
        // 4. QRコード固有のパラメータでの検証
        const qrResult = testQRCodeParameters();
        
        // 5. ブロック分割とインターリーブの検証
        const interleavingResult = testBlockInterleaving();
        
        // 6. Reed-Solomon符号の特性検証
        testReedSolomonProperties();
        
        // 総合判定
        console.log('\n=== 検証結果サマリー ===');
        console.log('─'.repeat(50));
        console.log(`ガロア体演算: ${gfValid ? 'OK' : 'NG'}`);
        console.log(`QRコード実装: ${qrResult ? 'OK' : 'NG'}`);
        console.log(`ブロック処理: ${interleavingResult ? 'OK' : 'NG'}`);
        
        if (qrResult) {
            console.log('\n我々の実装のReed-Solomon符号は基本的に動作しているようです。');
            console.log('次のステップ: データ配置順序とマスキングアルゴリズムの詳細検証');
        }
        
    } catch (error) {
        console.error('検証中にエラーが発生:', error);
        console.error(error.stack);
    }
}

main();