# 大津神 - Slack × Dify × Azure 社内ナレッジボット

## 概要

「大津神」は、Difyの検索拡張生成（RAG）機能を活用し、Slack上で社内ドキュメントやナレッジベースに対する質問に自動で回答するAIボットです。Azure Web App上でNode.jsアプリとして稼働し、情報アクセスの効率化・ナレッジ共有の促進を実現します。

---

## 主な特徴
- **RAG（検索拡張生成）**: 社内ドキュメントから関連情報を検索し、AIが根拠付きで回答
- **Slack連携**: チャンネル/DMでの自然言語質問に対応
- **引用元の明示**: 回答の根拠となるドキュメント名を自動表示
- **Azure Web App対応**: Node.jsアプリとしてそのままデプロイ可能
- **セキュアな運用**: 環境変数によるAPIキー・トークン管理

---

## システム構成

```
Slackユーザー
   │
   ▼
Slackアプリ（Event API）
   │
   ▼
Azure Web App（Node.js: akitademo-slack-bot）
   │
   ▼
Dify API（RAG/LLM/ナレッジベース）
```

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
└── ...
```

---

## セットアップ手順

### 前提条件
- Node.js 18以上
- Slackワークスペースの管理者権限
- Difyアカウント
- Microsoft Azureアカウント
- GitHubアカウント

### 1. Difyの準備
- [Dify](https://dify.ai/)でアカウント作成
- ナレッジベース（社内ドキュメント等）をアップロードし、APIキーを取得
- APIエンドポイントは `https://api.dify.ai/v1/chat-messages` を推奨

### 2. Slackアプリの作成
- [Slack API](https://api.slack.com/apps)で新規アプリ作成
- Bot Token Scopes: `app_mentions:read`, `chat:write`, `channels:history`, `channels:read`, `groups:history`, `im:history`
- Event Subscriptions: `app_mention`, `message.channels`, `message.im`
- App Home: 「Messages Tab」有効化
- Bot Token（`xoxb-...`）とSigning Secretを控える

### 3. Azure Web Appの準備
- Azure Portalでリソースグループ・App Serviceプラン・Web Appを作成
- ランタイム: Node.js 18 LTS
- GitHubリポジトリと連携し、CI/CDを構成

### 4. Azure環境変数の設定
Azure Web Appの「構成」→「アプリケーション設定」で以下を追加：

| 名前                  | 値（例）                                      |
|-----------------------|-----------------------------------------------|
| SLACK_BOT_TOKEN       | xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxx             |
| SLACK_SIGNING_SECRET  | xxxxxxxx                                     |
| DIFY_API_KEY          | sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx               |
| DIFY_API_ENDPOINT     | https://api.dify.ai/v1/chat-messages          |
| PORT                  | 8080                                          |
| NODE_ENV              | production                                    |

> ※ `.env`ファイルはローカル開発用。Azure本番では「構成」から設定してください。

### 5. デプロイとSlack連携
- GitHub Actions等で自動デプロイ
- デプロイ後、Web AppのURL（例: `https://your-app-name.azurewebsites.net/slack/events`）をSlackのEvent SubscriptionsのRequest URLに設定
- Slackアプリをワークスペースにインストール

---

## 使い方

### チャンネルでの質問
1. `/invite @大津神` でボットをチャンネルに追加
2. メンションして質問  
   例:  
   `@大津神 社内規定について教えて`

### DMでの質問
1. ボットに直接メッセージを送信
2. 例:  
   `有給休暇の申請方法は？`

### 応答例
```
有給休暇の申請方法は以下の通りです：
- 申請フォームに必要事項を記入
- 上長の承認を得る

*参照情報:*
>1. 社内就業規則.pdf
```

---

## 本番用コードのポイント
- Slackからのメッセージ受信時、Dify API（環境変数で指定）に問い合わせてAI応答を生成
- 参照情報も自動で付与
- Azureの環境変数は`config.js`経由で全て取得
- ログは`logs/`ディレクトリおよびコンソールに出力

---

## トラブルシューティング

### ボットが応答しない場合
- Azureの「構成」で環境変数が正しいか確認
- Slack APIの「Event Subscriptions」ステータスを確認
- Azureの「ログストリーム」や`logs/`ディレクトリのエラーログを確認
- Dify APIキーやナレッジベース設定を再確認

### よくあるエラー
- **invalid_auth**: Slackトークンが古い/間違い → 最新トークンを再設定
- **Dify APIエラー**: APIキーやエンドポイント、ナレッジベースを再確認
- **イベントサブスクリプション検証失敗**: Azure Web AppのURLや起動状態を確認

---

## セキュリティ・運用Tips
- APIキーやトークンは**絶対にGitHub等に公開しない**
- Azureの「構成」でのみ管理し、漏洩時は速やかにローテーション
- 必要に応じて、特定チャンネル/ユーザーのみ応答する制御も実装可能

---

## FAQ

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