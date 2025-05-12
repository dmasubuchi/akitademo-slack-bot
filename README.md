

# 大津神 - Dify × Slack RAGボット

## 概要
「大津神」は、Difyの検索拡張生成（RAG）機能を活用したSlackボットです。社内ドキュメントやナレッジベースに対する質問に回答し、チーム内のナレッジ共有と情報アクセスを効率化します。

## 特徴
- **RAG（検索拡張生成）**: 既存の社内ドキュメントから関連情報を検索・抽出し、的確な回答を生成
- **簡単な質問方法**: チャンネルでのメンションまたはDMでの直接質問に対応
- **引用元の表示**: 回答の根拠となる情報源を明示
- **マルチチャンネル対応**: 複数のチャンネルで同時に利用可能

## アーキテクチャ
本システムは以下のコンポーネントで構成されています：
- Slackインターフェース（Bolt for JavaScript）
- Dify RAGプラットフォーム
- Azure Web App（Node.jsホスティング）
- ベクターデータベース（文書インデックス）

## セットアップ手順

### 前提条件
- Node.js 18以上
- Slackワークスペースの管理者権限
- Difyアカウント
- Azure Web Appアカウント

### 1. Slackアプリの作成
1. [Slack API](https://api.slack.com/apps)にアクセスし、「Create New App」→「From scratch」を選択
2. アプリ名「大津神」を入力し、ワークスペースを選択
3. 「OAuth & Permissions」で以下のスコープを追加：
   - `app_mentions:read`
   - `chat:write`
   - `channels:history`
   - `channels:read`
   - `groups:history`
   - `im:history`
4. 「Event Subscriptions」を有効化し、以下のイベントをサブスクライブ：
   - `app_mention`
   - `message.channels`
   - `message.im`
5. 「App Home」タブで、「Messages Tab」を有効化
6. ワークスペースにアプリをインストール
7. Bot Token (`xoxb-...`) と Signing Secret を保存

### 2. Difyのセットアップ
1. [Dify](https://dify.ai/)でアカウントを作成
2. 新しいアプリケーションを作成（RAG機能有効）
3. 適切なLLMプロバイダーを選択（OpenAI, Claude等）
4. 社内ドキュメントをアップロードしてインデックス化
5. APIセクションからAPIキーを取得

### 3. リポジトリのクローンとセットアップ
```bash
# リポジトリをクローン
git clone https://github.com/yourusername/akitademo-slack-bot.git
cd akitademo-slack-bot

# 依存関係のインストール
npm install
```

### 4. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定：
```
# Slack設定
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret

# Dify設定
DIFY_API_KEY=your-dify-api-key
DIFY_API_ENDPOINT=https://api.dify.ai/v1/chat-messages

# サーバー設定
PORT=3000
```

### 5. ローカルでのテスト実行
```bash
# 開発モードで実行
npm run dev

# または本番モードで実行
npm start
```

### 6. Azure Web Appへのデプロイ
1. Azure PortalでリソースグループとApp Serviceを作成
2. GitHubリポジトリと連携するよう継続的デプロイを設定
3. 環境変数をAzure App Serviceの「構成」セクションに追加
4. デプロイが完了したら、URLをSlackアプリの「Event Subscriptions」のRequest URLに設定：
   ```
   https://your-app-name.azurewebsites.net/slack/events
   ```

## 使用方法

### チャンネルでの質問
1. 大津神ボットをチャンネルに追加（`/invite @大津神`）
2. メンションして質問：
   ```
   @大津神 プロジェクトXのスケジュールはどうなっていますか？
   ```

### DMでの質問
1. 大津神ボットに直接メッセージを送信
2. 質問を入力するだけ：
   ```
   社内規定の有給休暇の申請方法を教えてください
   ```

### 回答形式
ボットからの回答には、情報源となったドキュメントへの参照が含まれます：
```
プロジェクトXのスケジュールは以下の通りです：
- フェーズ1: 5月15日〜6月30日
- フェーズ2: 7月1日〜8月15日
- リリース: 8月31日

*参照情報:*
>1. プロジェクトX計画書.docx
>2. 2025年度開発ロードマップ.pdf
```

## カスタマイズ

### プロンプト調整
より良い回答品質を得るためには、Difyアプリケーションのプロンプト設定を調整します：
1. Difyダッシュボードの「Prompt Engineering」セクションにアクセス
2. ユースケースに合わせてプロンプトテンプレートを最適化

### 文書管理
1. 定期的に新しいドキュメントをDifyにアップロード
2. 古い情報は更新または削除

## トラブルシューティング

### ボットが応答しない場合
1. 環境変数が正しく設定されているか確認
2. Slack APIの「Event Subscriptions」のステータスを確認
3. アプリログでエラーメッセージを確認

### API制限に達した場合
1. Difyの利用プランをアップグレード
2. レート制限を回避するためにキャッシュ機構を実装

## ライセンス
このプロジェクトは社内利用限定です。無断転載・配布を禁止します。

## 連絡先
問題や質問がある場合は、内部チケットシステムまたは以下の担当者にお問い合わせください：
- 技術担当: tech@example.com
- 管理者: admin@example.com