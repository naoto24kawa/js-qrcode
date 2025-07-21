/**
 * QRコードライブラリのカスタムエラーハンドリング使用例
 */

import QRCode from '../src/index.js';

// ===== 基本的なエラーハンドリング =====

async function basicErrorHandling() {
  console.log('=== 基本的なエラーハンドリング ===');
  
  try {
    // 長すぎるデータでQRコードを生成（エラーが発生）
    const longData = 'A'.repeat(3000);
    const qr = await QRCode.generateWithAnalytics(longData);
  } catch (error) {
    console.log('エラータイプ:', error.constructor.name);
    console.log('エラーコード:', error.code);
    console.log('ユーザー向けメッセージ:', error.getUserMessage());
    console.log('技術的詳細:', error.details);
    console.log('エラー分類:', QRCode.classifyError(error));
  }
}

// ===== カスタムエラーハンドラーの登録 =====

async function customErrorHandlers() {
  console.log('\n=== カスタムエラーハンドラー ===');
  
  // 特定のエラーコードに対するハンドラー
  QRCode.onError('DATA_TOO_LONG', (error, context) => {
    console.log('カスタムハンドラー: データが長すぎます');
    console.log('データ長:', context.input?.dataLength);
    console.log('推奨事項:', error.suggestions);
    
    // 修正されたエラーを返す
    error.handledBy = 'DataTooLongHandler';
    return error;
  });
  
  // QRCodeGenerationError全般に対するハンドラー
  QRCode.onError(QRCode.errors.QRCodeGenerationError, (error, context) => {
    console.log('生成エラーハンドラー:', error.message);
    console.log('操作:', context.operation);
    return error;
  });
  
  // グローバルエラーハンドラー（フォールバック）
  QRCode.onAllErrors((error, context) => {
    console.log('グローバルハンドラー: 予期しないエラー');
    console.log('エラー:', error.message);
    return error;
  });
  
  try {
    const longData = 'B'.repeat(3000);
    await QRCode.generateWithAnalytics(longData);
  } catch (error) {
    console.log('処理されたエラー:', error.handledBy);
  }
}

// ===== エラー分析とメトリクス =====

async function errorAnalytics() {
  console.log('\n=== エラー分析とメトリクス ===');
  
  // 複数のエラーを発生させる
  const testCases = [
    { data: 'C'.repeat(3000), desc: '長すぎるデータ' },
    { data: '', desc: '空のデータ' },
    { data: null, desc: 'nullデータ' }
  ];
  
  for (const testCase of testCases) {
    try {
      await QRCode.generateWithAnalytics(testCase.data);
    } catch (error) {
      console.log(`テストケース "${testCase.desc}": ${error.code}`);
    }
  }
  
  // エラー統計を取得
  const stats = QRCode.getErrorStats();
  console.log('\nエラー統計:');
  console.log('- 総エラー数:', stats.total);
  console.log('- タイプ別:', stats.byType);
  console.log('- コード別:', stats.byCode);
  console.log('- 最近のエラー:', stats.recentErrors.slice(0, 3));
}

// ===== エラールーティングのカスタマイズ =====

async function customErrorRouting() {
  console.log('\n=== カスタムエラールーティング ===');
  
  // 重要度の高いエラーに対するカスタムルート
  QRCode.addErrorRoute({ severity: 'high' }, (error, context) => {
    console.log('高重要度エラー検出:', error.code);
    console.log('自動通知システムに送信...');
    
    // エラーに追加情報を付与
    error.notificationSent = true;
    error.priority = 'urgent';
    return error;
  });
  
  // 回復可能なエラーに対するルート
  QRCode.addErrorRoute({ recoverable: true }, (error, context) => {
    console.log('回復可能エラー:', error.code);
    console.log('回復提案:', error.suggestions);
    
    // 自動回復の試行
    if (error.code === 'DATA_TOO_LONG') {
      error.autoRecovery = {
        suggested: 'データの短縮',
        dataLength: context.input?.dataLength,
        maxLength: 2900
      };
    }
    
    return error;
  });
  
  try {
    await QRCode.generateWithAnalytics('D'.repeat(3000));
  } catch (error) {
    console.log('ルーティング結果:');
    console.log('- 通知送信:', error.notificationSent);
    console.log('- 優先度:', error.priority);
    console.log('- 自動回復情報:', error.autoRecovery);
  }
}

// ===== エラーミドルウェアの使用 =====

async function errorMiddleware() {
  console.log('\n=== エラーミドルウェア ===');
  
  // ログ記録ミドルウェア
  QRCode.useErrorMiddleware((error, context) => {
    console.log(`[${new Date().toISOString()}] ${error.constructor.name}: ${error.code}`);
    return error;
  });
  
  // エラー変換ミドルウェア
  QRCode.useErrorMiddleware((error, context) => {
    // 本番環境では詳細なエラー情報を隠す
    if (process.env.NODE_ENV === 'production') {
      error.details = { environment: 'production' };
      error.stack = undefined;
    }
    return error;
  });
  
  // パフォーマンス測定ミドルウェア
  QRCode.useErrorMiddleware((error, context) => {
    if (context.metrics && context.metrics.duration > 1000) {
      console.log('注意: 処理に時間がかかりすぎています:', context.metrics.duration + 'ms');
      error.performanceWarning = true;
    }
    return error;
  });
  
  try {
    await QRCode.generateWithAnalytics(null);
  } catch (error) {
    console.log('ミドルウェア処理後:', {
      hasDetails: !!error.details,
      hasStack: !!error.stack,
      performanceWarning: error.performanceWarning
    });
  }
}

// ===== コンテキスト情報の活用 =====

async function contextInformation() {
  console.log('\n=== コンテキスト情報の活用 ===');
  
  // コンテキスト情報を使用するハンドラー
  QRCode.onError('INVALID_DATA', (error, context) => {
    console.log('詳細なコンテキスト情報:');
    console.log('- 操作:', context.operation);
    console.log('- 入力データ:', context.input);
    console.log('- 環境:', context.environment);
    console.log('- カスタム情報:', context.custom);
    
    // コンテキストに基づく詳細な診断
    if (context.environment?.platform === 'browser') {
      console.log('ブラウザ環境での実行を検出');
    }
    
    if (context.input?.dataType !== 'string') {
      console.log('警告: 文字列以外のデータ型が検出されました');
    }
    
    return error;
  });
  
  try {
    await QRCode.generateWithAnalytics(123); // 数値を渡してエラーを発生
  } catch (error) {
    // エラーのJSON表現も確認
    console.log('\nエラーのJSON表現:');
    console.log(JSON.stringify(error.toJSON(), null, 2));
  }
}

// ===== 実際の使用例 =====

async function practicalExample() {
  console.log('\n=== 実際の使用例 ===');
  
  // 実際のアプリケーションでの使用パターン
  class QRCodeService {
    constructor() {
      this.setupErrorHandling();
    }
    
    setupErrorHandling() {
      // ユーザー向けエラー処理
      QRCode.onError('DATA_TOO_LONG', (error, context) => {
        this.showUserMessage('データが長すぎます。短くしてもう一度お試しください。');
        this.logError(error, context);
        return error;
      });
      
      QRCode.onError('INVALID_DATA', (error, context) => {
        this.showUserMessage('入力データが無効です。正しい形式で入力してください。');
        this.logError(error, context);
        return error;
      });
      
      // システムエラーの監視
      QRCode.addErrorRoute({ severity: 'critical' }, (error, context) => {
        this.alertDevelopers(error, context);
        return error;
      });
    }
    
    async generateQRCode(data, options = {}) {
      try {
        const result = await QRCode.generateWithAnalytics(data, { ...options, returnObject: true });
        console.log('QRコード生成成功');
        return result;
      } catch (error) {
        console.log('QRコード生成エラー:', error.getUserMessage());
        throw error;
      }
    }
    
    showUserMessage(message) {
      console.log(`[ユーザー通知] ${message}`);
    }
    
    logError(error, context) {
      console.log(`[ログ] ${error.code}: ${error.message}`);
    }
    
    alertDevelopers(error, context) {
      console.log(`[開発者アラート] クリティカルエラー: ${error.code}`);
    }
  }
  
  const service = new QRCodeService();
  
  // 正常ケース
  try {
    await service.generateQRCode('Hello World');
  } catch (error) {
    // エラー処理は setupErrorHandling で設定済み
  }
  
  // エラーケース
  try {
    await service.generateQRCode('E'.repeat(3000));
  } catch (error) {
    // エラー処理は setupErrorHandling で設定済み
  }
}

// ===== すべての例を実行 =====

async function runAllExamples() {
  await basicErrorHandling();
  await customErrorHandlers();
  await errorAnalytics();
  await customErrorRouting();
  await errorMiddleware();
  await contextInformation();
  await practicalExample();
  
  console.log('\n=== 最終統計 ===');
  const finalStats = QRCode.getErrorStats();
  console.log('総エラー数:', finalStats.total);
  console.log('ハンドラー情報:', QRCode.getHandlersInfo());
}

// 実行（この例がモジュールとして読み込まれた場合）
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  basicErrorHandling,
  customErrorHandlers,
  errorAnalytics,
  customErrorRouting,
  errorMiddleware,
  contextInformation,
  practicalExample,
  runAllExamples
};