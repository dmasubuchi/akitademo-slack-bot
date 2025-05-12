// メインのアプリケーションファイル
const logger = require('./logger');
const { startApp } = require('./slack');

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  logger.error('未処理の拒否:', error);
});

// アプリ起動
(async () => {
  try {
    await startApp();
  } catch (error) {
    logger.error('アプリケーション起動エラー:', error);
    process.exit(1);
  }
})();
