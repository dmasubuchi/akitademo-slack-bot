require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');

// 環境変数からの設定読み込み
const port = process.env.PORT || 3000;
const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const difyApiKey = process.env.DIFY_API_KEY;
const difyApiEndpoint = process.env.DIFY_API_ENDPOINT;

// Slackアプリの初期化
const app = new App({
  token: slackBotToken,
  signingSecret: slackSigningSecret
});

// Dify APIクライアント
const difyClient = axios.create({
  baseURL: difyApiEndpoint,
  headers: {
    'Authorization': `Bearer ${difyApiKey}`,
    'Content-Type': 'application/json'
  }
});

// メッセージハンドラ
app.message(async ({ message, say }) => {
  try {
    // ボットのメッセージは無視
    if (message.subtype === 'bot_message') return;
    
    // 処理中メッセージ
    await say({
      text: "調べています...",
      thread_ts: message.ts
    });
    
    // Dify APIにリクエスト
    const response = await difyClient.post('', {
      inputs: {},
      query: message.text,
      response_mode: "blocking",
      user: message.user
    });
    
    // 応答を取得
    const answer = response.data.answer;
    
    // 引用元の取得
    const references = response.data.references || [];
    let referenceText = '';
    
    if (references.length > 0) {
      referenceText = "\n\n*参照情報:*\n";
      references.forEach((ref, index) => {
        referenceText += `>${index + 1}. ${ref.title || '参照ドキュメント'}\n`;
      });
    }
    
    // 結果を返信
    await say({
      text: answer + referenceText,
      thread_ts: message.ts
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    await say({
      text: "エラーが発生しました。しばらくしてからもう一度お試しください。",
      thread_ts: message.ts
    });
  }
});

// メンション対応
app.event('app_mention', async ({ event, say }) => {
  try {
    // 処理中メッセージ
    await say({
      text: "調べています...",
      thread_ts: event.ts
    });
    
    // テキストからメンション部分を削除
    const query = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    // Dify APIにリクエスト
    const response = await difyClient.post('', {
      inputs: {},
      query: query,
      response_mode: "blocking",
      user: event.user
    });
    
    // 応答を取得
    const answer = response.data.answer;
    
    // 引用元の取得
    const references = response.data.references || [];
    let referenceText = '';
    
    if (references.length > 0) {
      referenceText = "\n\n*参照情報:*\n";
      references.forEach((ref, index) => {
        referenceText += `>${index + 1}. ${ref.title || '参照ドキュメント'}\n`;
      });
    }
    
    // 結果を返信
    await say({
      text: answer + referenceText,
      thread_ts: event.ts
    });
    
  } catch (error) {
    console.error('Error:', error);
    await say({
      text: "エラーが発生しました。しばらくしてからもう一度お試しください。",
      thread_ts: event.ts
    });
  }
});

// アプリ起動
(async () => {
  await app.start(port);
  console.log(`⚡️ 大津神ボットが起動しました on port ${port}`);
})();
