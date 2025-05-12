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

// モジュールのエクスポートを更新
module.exports = {
  queryDify,
  queryDifyWithRetry
};
