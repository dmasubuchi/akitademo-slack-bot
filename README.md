# 大津神 - Dify × Slack RAGボット

## 概要

「大津神」は、Difyの検索拡張生成（RAG: Retrieval-Augmented Generation）機能を活用したSlackボットです。  
Slack上での自然言語による質問に対し、社内ドキュメントやナレッジベースから関連情報を検索・抽出し、根拠付きの回答を自動生成します。  
チームのナレッジ共有・情報アクセスの効率化を目的としています。

---

## 主な特徴

- **RAG（検索拡張生成）**  
  社内ドキュメントから関連情報を検索し、AIが根拠付きで回答を生成します。
- **Slack連携**  
  チャンネルでのメンション、またはDMでの直接質問に対応。
- **引用元の明示**  
  回答の根拠となるドキュメント名やファイル名を自動で表示。
- **マルチチャンネル対応**  
  複数チャンネル・複数ユーザーで同時利用可能。
- **Azure Web App対応**  
  Node.jsアプリとしてAzure Web Appにそのままデプロイ可能。

---

## ディレクトリ構成

```
akitademo-slack-bot/
├── src/
│   ├── index.js         # アプリのエントリーポイント
│   ├── slack.js         # Slackボット機能（Bolt for JS利用）
│   ├── dify.js          # Dify API連携モジュール
│   ├── config.js        # 環境変数・設定管理
│   └── logger.js        # winstonによるロギング
├── logs/                # ログファイル出力先
├── .env                 # 環境変数ファイル（Git管理外）
├── package.json         # 依存パッケージ・スクリプト
├── README.md            # このファイル
└── ...（その他省略）
```

---

## セットアップ手順

### 前提条件

- Node.js 18以上
- Slackワークスペースの管理者権限
- Difyアカウント
- Azure Web Appアカウント

### 1. Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)で新規アプリ作成（From scratch）
2. アプリ名「大津神」を入力し、ワークスペースを選択
3. 「OAuth & Permissions」で以下のBotスコープを追加  
   `app_mentions:read`, `chat:write`, `channels:history`, `channels:read`, `groups:history`, `im:history`
4. 「Event Subscriptions」を有効化し、  
   `app_mention`, `message.channels`, `message.im` をサブスクライブ
5. 「App Home」タブで「Messages Tab」を有効化
6. ワークスペースにアプリをインストール
7. Bot Token (`xoxb-...`) と Signing Secret を控える

### 2. Difyのセットアップ

1. [Dify](https://dify.ai/)でアカウント作成
2. 新規アプリケーション作成（RAG機能有効化）
3. LLMプロバイダー（OpenAI, Claude等）を選択
4. 社内ドキュメントをアップロードしインデックス化
5. APIセクションからAPIキーを取得

### 3. リポジトリのクローンとセットアップ

```bash
git clone https://github.com/yourusername/akitademo-slack-bot.git
cd akitademo-slack-bot
npm install
```

### 4. 環境変数の設定

`.env`ファイルを作成し、以下を記入

```
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
DIFY_API_KEY=your-dify-api-key
DIFY_API_ENDPOINT=https://api.dify.ai/v1/chat-messages
PORT=3000
```

> **重要:** Azure Web Appにデプロイする場合は、Azure Portalの「構成」セクションで上記環境変数を必ず設定してください。  
> SlackトークンはSlackアプリ管理画面で最新のものを取得し、Azure側も必ず一致させてください。

### 5. ローカルでのテスト実行

```bash
npm run dev   # 開発モード
npm start     # 本番モード
```

### 6. Azure Web Appへのデプロイ

1. Azure PortalでリソースグループとApp Serviceを作成
2. GitHubリポジトリと連携し継続的デプロイを設定
3. Azure App Serviceの「構成」で環境変数を追加
4. デプロイ後、  
   `https://your-app-name.azurewebsites.net/slack/events`  
   をSlackアプリの「Event Subscriptions」のRequest URLに設定

---

## コード構造と動作概要

- `src/index.js`  
  アプリのエントリーポイント。`startApp()`でSlackボットを起動し、未処理例外をロギング。
- `src/slack.js`  
  Slackイベントの受信・応答ロジック。  
  - `app.message`で通常メッセージを処理  
  - `app.event('app_mention')`でメンションイベントを処理  
  - Dify API連携は`dify.js`経由で行うが、**現在はテスト用にDifyバイパス実装**（下記参照）
- `src/dify.js`  
  Dify APIとの通信・リトライ処理
- `src/config.js`  
  環境変数の読み込みとアプリ設定
- `src/logger.js`  
  winstonによるファイル・コンソール両対応のロギング

---

## テスト・デバッグ運用（2024/06時点の一時的な仕様）

### テスト用コードについて

現在、Slackボットの基本動作確認のため、Dify連携を一時的にバイパスし、受信メッセージをそのまま返すテスト用コードになっています。

#### `src/slack.js` の該当部分

```js
// メッセージハンドラ
app.message(async ({ message, say }) => {
  try {
    if (message.subtype === 'bot_message') return;
    console.log('メッセージ受信:', JSON.stringify(message, null, 2));
    const threadTs = message.thread_ts || message.ts;
    await say({
      text: `こんにちは！メッセージを受け取りました: "${message.text}"`,
      thread_ts: threadTs
    });
  } catch (error) {
    console.error('メッセージ処理エラー:', error);
    console.error('エラー詳細:', JSON.stringify(error, null, 2));
    await say({
      text: "エラーが発生しました。しばらくしてからもう一度お試しください。",
      thread_ts: message.thread_ts || message.ts
    });
  }
});
```

- 受信したメッセージ内容がAzureのログストリームやコンソールに詳細に出力されます。
- Dify連携を再開する場合は、`queryDifyWithRetry`等の元のコードに戻してください。

#### メンションイベントのデバッグ

`app_mention`イベントでも、イベント内容が`console.log`で出力されます。

---

## 使い方

### チャンネルでの質問

1. `/invite @大津神` でボットをチャンネルに追加
2. メンションして質問  
   例:  
   `@大津神 プロジェクトXのスケジュールは？`

### DMでの質問

1. ボットに直接メッセージを送信
2. 例:  
   `社内規定の有給休暇の申請方法を教えて`

### テスト用応答例

```
こんにちは！メッセージを受け取りました: "プロジェクトXのスケジュールは？"
```

---

## トラブルシューティング

### ボットが応答しない場合

- Azureの「構成」で環境変数が正しいか確認
- Slack APIの「Event Subscriptions」ステータスを確認
- Azureの「ログストリーム」や`logs/`ディレクトリのエラーログを確認
- Slackトークンが最新かつ一致しているか再確認

### API制限やDify連携の問題

- Dify連携を再開する場合は、`src/slack.js`の該当箇所を元に戻してください
- DifyのAPIキーやエンドポイントが正しいか確認

---

## よくある質問（FAQ）

**Q. Azure以外のNode.jsサーバーでも動きますか？**  
A. はい、Node.js 18以上が動作する環境であれば動作します。

**Q. ログはどこに出力されますか？**  
A. `logs/`ディレクトリにファイル出力されます。AzureではApplication Insights等の利用も推奨します。

**Q. DifyのAPIキーやSlackトークンが漏洩した場合は？**  
A. 速やかに該当キーを無効化し、新しいキーを発行してください。

---

## ライセンス

このプロジェクトは社内利用限定です。無断転載・配布を禁止します。

---

## 問い合わせ先

- 技術担当: tech@example.com
- 管理者: admin@example.com