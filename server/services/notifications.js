const axios = require('axios');
const { pool } = require('../database/init');

const getTelegramSettings = async () => {
  const result = await pool.query(
    'SELECT key, value FROM settings WHERE key IN ($1, $2)',
    ['telegram_bot_token', 'telegram_chat_id']
  );

  const settings = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });

  return {
    botToken: settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN,
    chatId: settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID
  };
};

const sendTelegramNotification = async (title, message) => {
  try {
    const { botToken, chatId } = await getTelegramSettings();

    if (!botToken || !chatId) {
      throw new Error('Telegram bot token or chat ID not configured');
    }

    const fullMessage = `${title}\n\n${message}`;
    
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: fullMessage,
        parse_mode: 'HTML'
      }
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    console.log('Telegram notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error.message);
    throw error;
  }
};

module.exports = { sendTelegramNotification };