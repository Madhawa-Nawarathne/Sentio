const axios = require('axios');

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function analyzeEmotion(text) {
  const response = await aiClient.post(
    '/predict-emotion',
    { text }
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error ||
      'Emotion analysis failed'
    );
  }

  return response.data.result;
}

async function analyzeSentiment(text) {
  const response = await aiClient.post(
    '/predict-sentiment',
    { text }
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error ||
      'Sentiment analysis failed'
    );
  }

  return response.data.result;
}

module.exports = {
  analyzeEmotion,
  analyzeSentiment
};