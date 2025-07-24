const axios = require('axios');
const { pool } = require('../database/init');
const { sendTelegramNotification } = require('./notifications');

const checkDomain = async (domain) => {
  const startTime = Date.now();
  let status = 'down';
  let errorMessage = null;
  let responseTime = null;

  try {
    const response = await axios.get(domain.url, {
      timeout: 10000, // 10 seconds timeout
      validateStatus: (status) => status < 400 // Accept 2xx and 3xx as success
    });

    responseTime = Date.now() - startTime;
    status = 'up';
  } catch (error) {
    responseTime = Date.now() - startTime;
    
    if (error.response) {
      // Server responded with error status
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      errorMessage = 'Connection timeout';
    } else if (error.code === 'ENOTFOUND') {
      // DNS resolution failed
      errorMessage = 'Domain not found';
    } else {
      // Other network errors
      errorMessage = error.message;
    }
  }

  // Update domain status
  await pool.query(
    'UPDATE domains SET status = $1, last_checked = CURRENT_TIMESTAMP, response_time = $2 WHERE id = $3',
    [status, responseTime, domain.id]
  );

  // Log the check result
  await pool.query(
    'INSERT INTO status_logs (domain_id, status, response_time, error_message) VALUES ($1, $2, $3, $4)',
    [domain.id, status, responseTime, errorMessage]
  );

  // Check if status changed from up to down
  if (status === 'down' && domain.status === 'up') {
    try {
      await sendTelegramNotification(
        `🚨 Domain Down Alert`,
        `Domain: ${domain.name}\nURL: ${domain.url}\nStatus: DOWN\nError: ${errorMessage}\nTime: ${new Date().toLocaleString()}`
      );
    } catch (notificationError) {
      console.error('Failed to send Telegram notification:', notificationError);
    }
  }

  return {
    domain_id: domain.id,
    status,
    response_time: responseTime,
    error_message: errorMessage,
    checked_at: new Date()
  };
};

module.exports = { checkDomain };