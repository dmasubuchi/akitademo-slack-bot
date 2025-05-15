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
    
    // Difyをバイパスして直接応答
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
