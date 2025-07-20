# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは、Workers環境とSSRでの使用に最適化された純粋なJavaScriptのQRコードライブラリです。外部依存関係なしでQRコードの生成（SVG形式）と読み取り機能を提供します。

## 開発コマンド

### ビルド
- `npm run build` - Rollupを使用してUMD、ESモジュール形式のディストリビューションファイルを生成
- `npm run dev` - ウォッチモードでビルド

### テスト
- `npm test` - 全テストの実行
- `npm test:watch` - ウォッチモードでテスト実行

### コード品質
- `npm run lint` - ESLintでコードリンティング
- `npm run format` - Prettierでコード整形

### リリース
- `npm run preversion` - テスト・リント実行（バージョンアップ前の自動チェック）
- `npm run prepare` - ビルドを実行（npmへのpublish前の自動実行）

## アーキテクチャ

### コアコンポーネント

- **`src/index.js`** - メインAPI（`QRCode.generate`、`QRCode.decode`）とバリデーション
- **`src/generator.js`** - QRコード生成ロジック（エンコーダー、レンダラーを統合）
- **`src/encoder.js`** - データエンコーディング（数字、英数字、バイト、漢字モード対応）
- **`src/decoder.js`** - QRコード読み取りロジック
- **`src/scanner.js`** - ブラウザ環境でのカメラスキャン機能（クライアントサイド補助機能）

### データ処理レイヤー

- **`src/data-encoder.js`** - 入力データの各エンコーディングモード処理
- **`src/reed-solomon.js`** - エラー訂正符号化
- **`src/format-info.js`** - 形式情報の生成・配置
- **`src/masking.js`** - マスクパターンの適用と評価

### 構造構築レイヤー

- **`src/pattern-builder.js`** - ファインダーパターン、アライメントパターン、タイミングパターンの配置
- **`src/module-builder.js`** - QRコードマトリクスの構築とデータ配置

### レンダリング

- **`src/renderers/svg-renderer.js`** - SVG形式での出力（Workers/SSR環境での主要出力形式）
- **`src/renderers/png-renderer.js`** - PNG形式での出力（実装状況要確認）

### ユーティリティ

- **`src/constants.js`** - QR仕様の定数定義
- **`src/utils.js`** - 共通ユーティリティ関数
- **`src/errors.js`** - カスタムエラークラス

## テスト構成

### 単体テスト（`tests/unit/`）
各コンポーネントの機能別テストファイル

### 統合テスト（`tests/integration/`）
メインAPIの統合テスト

### テストヘルパー（`tests/helpers/`）
テスト用のモック、アサーション、データ生成ユーティリティ

## 主要な開発方針

### Workers環境最適化
- SVG出力によるレスポンス時間最適化
- エラー訂正レベルによる品質制御
- コールドスタート時間の最小化

### クロスプラットフォーム対応
- ES Modules（Workers/SSR）とCommonJS（Node.js）の両対応
- ブラウザでのカメラ機能は補助機能として実装

### QR仕様準拠
- バージョン1-40サポート
- 4つのエンコーディングモード（数字、英数字、バイト、漢字）
- エラー訂正レベルL/M/Q/H対応
- マスクパターンの自動選択と評価

## ビルド設定

Rollupを使用してUMD、ES modules形式のバンドルを生成。Terserによる最小化版も作成。