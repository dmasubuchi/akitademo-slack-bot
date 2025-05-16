# Slack+Dify+Azure で作る社内ナレッジボット「大津神」開発ガイド

<!-- ここに「大津神」ボットのイメージ図または構成図を挿入すると良いでしょう -->

## はじめに

このガイドでは、Slack上で動作する社内ナレッジベース検索ボット「大津神」の構築方法を解説します。このボットは、Difyの検索拡張生成（RAG）機能を活用し、Azure Web Appでホストすることで、社内ドキュメントに対する質問に自動で回答できるシステムです。

社内に蓄積された情報を簡単に検索・参照できるようになるため、情報アクセス効率の向上、回答の一貫性確保、ナレッジ共有の促進などのメリットがあります。

## 前提条件

- Node.js 18以上
- Slackワークスペースの管理者権限
- Difyアカウント（無料プランでも可能）
- Microsoft Azureアカウント
- Githubアカウント

## システム構成

「大津神」ボットは以下のコンポーネントで構成されています：

1. **Slackアプリ**: ユーザーとのインターフェース
2. **Azure Web App**: ボットのバックエンドサーバー（Node.js）
3. **Dify**: RAG機能を提供するAIプラットフォーム
4. **Github**: ソースコード管理とCICD

<!-- ここにシステム構成図を挿入すると理解が深まります。Slack、Azure、Difyの連携を示す図を用意してください -->

## 開発手順

### 1. Difyアプリケーションの作成

Difyは、LLMを活用したアプリケーション構築を支援するプラットフォームです。ここではRAG機能を持つチャットボットを作成します。

1. [Dify公式サイト](https://dify.ai/)にアクセスし、アカウントを作成またはログイン

2. 新しいアプリケーションを作成
   - 「最初から作成」をクリック
   - アプリの種類として「チャットボット」を選択
   - アプリ名に「大津神」と入力し、説明を記入
   - 「作成する」をクリック

3. プロンプト設定
   - 「オーケストレーション」タブを選択
   - 以下のようなプロンプトを設定（日本語で入力）

```
あなたは「大津神」という名前の社内ナレッジアシスタントです。以下のガイドラインに従って質問に回答してください：

【役割】
- 社内ドキュメントやナレッジベースに含まれる情報に基づいて、正確で簡潔な回答を提供する
- 検索された情報源を明示し、透明性を確保する
- 丁寧かつ親しみやすい言葉遣いを心がける

【回答方法】
1. 質問の意図を正確に理解する
2. 関連するドキュメントから最適な情報を抽出する
3. 簡潔かつ構造化された回答を作成する
4. 複数の情報源がある場合は統合して回答する
5. 不明点がある場合は率直に認め、わかる範囲で回答する

【禁止事項】
- 検索結果に含まれない情報の作り話
- 専門用語の過度な使用
- 長すぎる回答（3-4段落以内に収める）
- 曖昧な表現や不確かな情報の断定

【回答形式】
- 質問に直接回答する
- 必要に応じて箇条書きやセクションを使用して読みやすくする
- 情報源を「参照情報:」として回答の最後に記載する

常に礼儀正しく、親しみやすい口調で回答し、ユーザーの時間を尊重して簡潔に情報を提供してください。
```

4. コンテキスト設定
   - 「コンテキスト」セクションで「検索設定」をクリック
   - 「ナレッジ」タブから作成した知識ベースを選択（まだ作成していない場合は後で設定）
   - 検索数: 3-5（推奨設定）
   - 類似度: 0.7（必要に応じて調整）
   - 再ランキング: 有効

5. モデル設定
   - 「モデル」セクションでLLMモデルを選択
     - 高性能モデル: Claude 3 OpusまたはGPT-4（精度重視）
     - バランスモデル: Claude 3 SonnetまたはGPT-3.5 Turbo（コスト/性能バランス）
   - パラメータ設定
     - Max Tokens: 4000-8000（十分な回答長を確保）
     - Temperature: 0.1-0.3（低めに設定して正確性を優先）

6. APIアクセス設定
   - 左側メニューから「APIアクセス」を選択
   - APIキーをメモ（後でAzure環境変数として使用）
   - エンドポイントURLを確認（通常は `https://api.dify.ai/v1/chat-messages`）

7. ナレッジベースの作成
   - 左側メニューから「ナレッジ」を選択
   - 「作成」ボタンをクリック
   - ナレッジベース名を入力（例: 「社内ドキュメント」）
   - 「ファイルをアップロード」から社内文書をアップロード
     - サポート形式: PDF、Word、Excel、PowerPoint、TXT、Markdownなど
   - ドキュメントのインデックス化が完了するまで待機

### 2. Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
   - 「Create New App」をクリック
   - 「From scratch」を選択
   - App Name（例: 「大津神」）を入力し、ワークスペースを選択
   - 「Create App」をクリック

2. Bot Token Scopesの設定
   - 左側メニューから「OAuth & Permissions」を選択
   - 「Scopes」セクションまでスクロール
   - 「Bot Token Scopes」で以下のスコープを追加:
     - `app_mentions:read`
     - `chat:write`
     - `channels:history`
     - `channels:read`
     - `groups:history`
     - `im:history`
     - `commands`（スラッシュコマンドを使う場合）

3. イベントサブスクリプションの設定
   - 左側メニューから「Event Subscriptions」を選択
   - 「Enable Events」をオンに切り替え
   - Request URLは後でAzureデプロイ後に設定します（一時的に空のままでOK）
   - 「Subscribe to bot events」セクションで「Add Bot User Event」をクリック
   - 以下のイベントを追加:
     - `message.im`（DMでのメッセージ）
     - `message.channels`（チャンネルでのメッセージ）
     - `app_mention`（ボットへのメンション）
   - 設定は保存しますが、URL検証は後で行います

4. App Homeの設定
   - 左側メニューから「App Home」を選択
   - 「Messages Tab」を有効化
   - 「Allow users to send Slash commands and messages from the messages tab」にチェック

5. アプリのインストール
   - 左側メニューから「OAuth & Permissions」に戻る
   - 「Install to Workspace」ボタンをクリック
   - 権限を確認して「許可する」をクリック
   - Bot User OAuth Token（`xoxb-` で始まる）をメモ
   - Basic Informationの「App Credentials」セクションから「Signing Secret」もメモ

### 3. Node.jsアプリケーションの開発

1. 新しいGitHubリポジトリを作成
   - リポジトリ名: `akitademo-slack-bot`（任意）
   - README.md、.gitignoreファイル（Node.js用）を追加

2. リポジトリをローカルにクローン
   ```bash
   git clone https://github.com/yourusername/akitademo-slack-bot.git
   cd akitademo-slack-bot
   ```

3. プロジェクト初期化
   ```bash
   npm init -y
   npm install @slack/bolt axios dotenv
   npm install --save-dev nodemon
   ```

4. ファイル構造を作成
   ```bash
   mkdir -p src
   touch .env
   touch src/config.js
   touch src/dify.js
   touch src/slack.js
   touch src/index.js
   ```

5. `.env`ファイルを編集
   ```
   # Slack設定
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   SLACK_SIGNING_SECRET=your-slack-signing-secret

   # Dify設定
   DIFY_API_KEY=your-dify-api-key
   DIFY_API_ENDPOINT=https://api.dify.ai/v1/chat-messages

   # サーバー設定
   PORT=8080
   NODE_ENV=production
   ```

6. `src/config.js`ファイルを編集
   ```javascript
   // 設定ファイル
   require('dotenv').config();

   module.exports = {
     // Slack設定
     slackBotToken: process.env.SLACK_BOT_TOKEN,
     slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
     
     // Dify設定
     difyApiKey: process.env.DIFY_API_KEY,
     difyApiEndpoint: process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai/v1/chat-messages',
     
     // サーバー設定
     port: process.env.PORT || 8080,
     
     // アプリケーション設定
     botName: '大津神',
     maxRetries: 3,
     retryDelay: 1000
   };
   ```

7. `src/dify.js`ファイルを編集
   ```javascript
   // Dify API連携モジュール
   const axios = require('axios');
   const config = require('./config');

   // Dify APIクライアント
   const difyClient = axios.create({
     baseURL: config.difyApiEndpoint,
     headers: {
       'Authorization': `Bearer ${config.difyApiKey}`,
       'Content-Type': 'application/json'
     },
     timeout: 30000 // 30秒タイムアウト
   });

   /**
    * Dify APIにクエリを送信し、回答を取得する
    * @param {string} query - ユーザーからの質問
    * @param {string} userId - ユーザーID
    * @returns {Promise<Object>} - Difyからの応答
    */
   async function queryDify(query, userId) {
     try {
       const response = await difyClient.post('', {
         inputs: {},
         query: query,
         response_mode: "blocking",
         user: userId
       });
       
       return {
         answer: response.data.answer,
         references: response.data.references || []
       };
     } catch (error) {
       console.error('Dify API Error:', error.message);
       if (error.response) {
         console.error('Response status:', error.response.status);
         console.error('Response data:', error.response.data);
       }
       throw new Error(`Dify APIエラー: ${error.message}`);
     }
   }

   /**
    * リトライロジックを持つDify API呼び出し
    * @param {string} query - ユーザーからの質問
    * @param {string} userId - ユーザーID
    * @returns {Promise<Object>} - Difyからの応答
    */
   async function queryDifyWithRetry(query, userId) {
     let retries = 0;
     let lastError;
     
     while (retries < config.maxRetries) {
       try {
         return await queryDify(query, userId);
       } catch (error) {
         lastError = error;
         console.log(`APIリクエスト失敗 (${retries + 1}/${config.maxRetries}): ${error.message}`);
         
         // 一時的なエラーの場合のみリトライ
         if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
           retries++;
           // 遅延を入れる（指数バックオフ）
           const delay = config.retryDelay * Math.pow(2, retries - 1);
           await new Promise(resolve => setTimeout(resolve, delay));
         } else {
           // 一時的でないエラーはすぐに失敗
           break;
         }
       }
     }
     
     throw lastError || new Error('最大リトライ回数を超えました');
   }

   // モジュールのエクスポート
   module.exports = {
     queryDify,
     queryDifyWithRetry
   };
   ```

8. `src/slack.js`ファイルを編集
   ```javascript
   // Slackボット機能モジュール
   const { App } = require('@slack/bolt');
   const config = require('./config');
   const { queryDifyWithRetry } = require('./dify');

   // Slackアプリの初期化
   const app = new App({
     token: config.slackBotToken,
     signingSecret: config.slackSigningSecret
   });

   /**
    * 参照情報からテキストを作成
    * @param {Array} references - 参照情報の配列
    * @returns {string} - フォーマットされた参照テキスト
    */
   function formatReferences(references) {
     if (!references || references.length === 0) {
       return '';
     }
     
     let referenceText = "\n\n*参照情報:*\n";
     references.forEach((ref, index) => {
       referenceText += `>${index + 1}. ${ref.title || '参照ドキュメント'}\n`;
     });
     
     return referenceText;
   }

   /**
    * 処理中メッセージを送信
    * @param {Function} say - Slack say関数
    * @param {string} threadTs - スレッドのタイムスタンプ
    */
   async function sendTypingMessage(say, threadTs) {
     try {
       await say({
         text: "調べています...",
         thread_ts: threadTs
       });
     } catch (error) {
       console.error('処理中メッセージの送信エラー:', error);
     }
   }

   // メッセージハンドラ
   app.message(async ({ message, say }) => {
     try {
       // ボットのメッセージは無視
       if (message.subtype === 'bot_message') return;
       
       console.log('メッセージ受信:', JSON.stringify(message, null, 2));
       
       // スレッドの親メッセージも処理対象とする
       const threadTs = message.thread_ts || message.ts;
       
       // 処理中メッセージ
       await sendTypingMessage(say, threadTs);
       
       // Dify APIに問い合わせ (リトライ付き)
       const { answer, references } = await queryDifyWithRetry(message.text, message.user);
       
       // 参照情報の整形
       const referenceText = formatReferences(references);
       
       // 結果を返信
       await say({
         text: answer + referenceText,
         thread_ts: threadTs
       });
       
     } catch (error) {
       console.error('メッセージ処理エラー:', error);
       await say({
         text: "エラーが発生しました。しばらくしてからもう一度お試しください。",
         thread_ts: message.thread_ts || message.ts
       });
     }
   });

   // メンション対応
   app.event('app_mention', async ({ event, say }) => {
     try {
       console.log('メンション受信:', JSON.stringify(event, null, 2));
       
       // 処理中メッセージ
       await sendTypingMessage(say, event.ts);
       
       // テキストからメンション部分を削除
       const query = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
       
       // Dify APIに問い合わせ (リトライ付き)
       const { answer, references } = await queryDifyWithRetry(query, event.user);
       
       // 参照情報の整形
       const referenceText = formatReferences(references);
       
       // 結果を返信
       await say({
         text: answer + referenceText,
         thread_ts: event.ts
       });
       
     } catch (error) {
       console.error('メンション処理エラー:', error);
       await say({
         text: "エラーが発生しました。しばらくしてからもう一度お試しください。",
         thread_ts: event.ts
       });
     }
   });

   // アプリを起動する関数
   async function startApp() {
     await app.start(config.port);
     console.log(`⚡️ ${config.botName}ボットが起動しました on port ${config.port}`);
   }

   module.exports = {
     app,
     startApp
   };
   ```

9. `src/index.js`ファイルを編集
   ```javascript
   // メインのアプリケーションファイル
   const { startApp } = require('./slack');

   // エラーハンドリング
   process.on('unhandledRejection', (error) => {
     console.error('未処理の拒否:', error);
   });

   // アプリ起動
   (async () => {
     try {
       await startApp();
     } catch (error) {
       console.error('アプリケーション起動エラー:', error);
       process.exit(1);
     }
   })();
   ```

10. `package.json`のscriptsセクションを編集
    ```json
    "scripts": {
      "start": "node src/index.js",
      "dev": "nodemon src/index.js",
      "test": "echo \"Error: no test specified\" && exit 0"
    }
    ```

11. 変更をコミットしてプッシュ
    ```bash
    git add .
    git commit -m "初期実装: 大津神Slackボット"
    git push origin main
    ```

### 4. Azure Web Appのセットアップ

1. [Azure Portal](https://portal.azure.com/)にログイン

2. リソースグループの作成
   - 「リソースグループ」を検索
   - 「作成」をクリック
   - 名前（例: `akitademo-slack-bot-rg`）を入力
   - リージョン（例: `Japan East`）を選択
   - 「確認と作成」→「作成」をクリック

3. App Serviceプランの作成
   - 「App Service プラン」を検索
   - 「作成」をクリック
   - リソースグループ、名前、リージョンを設定
   - 「Linuxプラン」を選択
   - 価格プランは「B1」など適切なものを選択
   - 「確認と作成」→「作成」をクリック

4. Web Appの作成
   - 「App Services」を検索
   - 「作成」→「Webアプリ」を選択
   - 基本情報を設定:
     - リソースグループ: 先ほど作成したもの
     - 名前: グローバルに一意な名前（例: `akitademo-slack-bot-webapp`）
     - 公開: コード
     - ランタイムスタック: Node.js 18 LTS
     - オペレーティングシステム: Linux
     - リージョン: Japan East
     - App Serviceプラン: 先ほど作成したもの
   - 「確認と作成」→「作成」をクリック

5. GitHubとの連携設定
   - Web Appリソースに移動
   - 「デプロイセンター」を選択
   - ソースとして「GitHub」を選択
   - GitHubアカウントを認証
   - 組織、リポジトリ、ブランチを選択
   - 「保存」をクリック

6. 環境変数の設定
   - Web Appリソースの「構成」→「アプリケーション設定」を選択
   - 「新しいアプリケーション設定」をクリックして以下を追加:
     - `SLACK_BOT_TOKEN`: Slackから取得したボットトークン
     - `SLACK_SIGNING_SECRET`: Slackから取得した署名シークレット
     - `DIFY_API_KEY`: Difyから取得したAPIキー
     - `DIFY_API_ENDPOINT`: Dify APIのエンドポイント（`https://api.dify.ai/v1/chat-messages`）
     - `NODE_ENV`: `production`
     - `PORT`: `8080`
   - 「保存」をクリック

7. アプリケーションの再起動
   - Web Appリソースの「概要」ページで「再起動」をクリック

8. デプロイの確認
   - 「デプロイセンター」でデプロイステータスを確認
   - GitHubからのデプロイが成功したことを確認

9. Web AppのURLを取得
   - 「概要」ページでデフォルトドメインを確認
   - 通常は `https://app-name.azurewebsites.net` の形式
   - このURLをメモ（Slackのイベントサブスクリプション設定で使用）

<!-- ここにAzure Portalのデプロイ設定画面のスクリーンショットを挿入すると良いでしょう -->

### 5. SlackとAzureの接続

1. Slack APIダッシュボードに戻る
   - [Slack API Dashboard](https://api.slack.com/apps)にアクセス
   - 作成したアプリ（大津神）を選択

2. Event Subscriptionsの設定を更新
   - 「Event Subscriptions」メニューに移動
   - Request URLを設定: `https://your-webapp-url.azurewebsites.net/slack/events`
   - URLの検証が成功したことを確認（「Verified」と表示される）
   - 「Save Changes」をクリック

3. アプリを再インストール
   - 「OAuth & Permissions」に移動
   - 「Install to Workspace」または「Reinstall to Workspace」をクリック
   - 確認ダイアログで「許可する」をクリック

### 6. ボットのテストと動作確認

1. Slackでのテスト
   - ボットを特定のチャンネルに招待: `/invite @大津神`
   - メンションして質問: `@大津神 会社の理念について教えて`
   - ダイレクトメッセージでの質問: DMに「有給休暇の申請方法は？」と入力

2. デバッグとトラブルシューティング
   - Azure Portalの「ログストリーム」でログを確認
   - エラーが発生した場合は内容を確認して対処

3. ボットの応答結果の確認
   - 回答の正確性
   - 参照情報の有無
   - 応答時間

## トラブルシューティング

### 一般的な問題と解決策

1. **ボットが応答しない**
   - Slack APIトークンとシークレットが正しいか確認
   - Azureの環境変数設定を確認
   - ログでエラーメッセージを確認

2. **「invalid_auth」エラー**
   - Slackのボットトークンを再生成
   - 環境変数に最新のトークンを設定
   - アプリを再起動

3. **イベントサブスクリプションのURL検証に失敗**
   - Azure Web AppのURLが正しいか確認
   - `/slack/events`パスが含まれているか確認
   - アプリが起動していることを確認

4. **Dify APIエラー**
   - APIキーとエンドポイントが正しいか確認
   - Difyでナレッジベースが正しく設定されているか確認

5. **デプロイの問題**
   - GitHubのアクションログを確認
   - 手動でAzureにデプロイを試行

## パフォーマンス最適化

1. **Difyの設定調整**
   - 検索パラメータ（検索数、類似度）を調整
   - より適切なLLMモデルを選択

2. **ナレッジベースの拡充**
   - より多くの関連ドキュメントを追加
   - 既存ドキュメントの品質を改善

3. **キャッシュ機構の導入**
   - 頻繁に問い合わせのある質問に対する回答をキャッシュ

## セキュリティに関する注意点

1. 環境変数（特にAPIキーやトークン）は公開リポジトリにコミットしないでください
2. リクエスト/レスポンスに機密情報が含まれる場合は適切な暗号化と制限を検討
3. アクセス制御を実装し、特定のチャンネルやユーザーのみがボットを使用できるよう制限できます

## まとめ

これで「大津神」Slackボットの構築は完了です。このボットを通じて、社内のナレッジベースに蓄積された情報に簡単にアクセスできるようになりました。定期的にDifyのナレッジベースを更新し、プロンプトやパラメータを調整することで、より質の高い応答を得ることができます。

<!-- ここに完成したボットの使用例画像やスクリーンショットを挿入すると良いでしょう -->

## 参考リンク

- [Slack API Documentation](https://api.slack.com/docs)
- [Dify Documentation](https://docs.dify.ai/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [@slack/bolt Documentation](https://slack.dev/bolt-js/concepts)