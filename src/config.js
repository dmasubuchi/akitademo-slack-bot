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
  port: process.env.PORT || 3000,
  
  // アプリケーション設定
  botName: '大津神',
  maxRetries: 3,
  retryDelay: 1000
};
