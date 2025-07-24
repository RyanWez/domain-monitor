const cron = require('node-cron');
const { pool } = require('../database/init');
const { checkDomain } = require('./checker');

let monitoringJob = null;

const startMonitoring = () => {
  const interval = process.env.CHECK_INTERVAL_MINUTES || 5;
  const cronExpression = `*/${interval} * * * *`; // Every N minutes

  console.log(`Starting domain monitoring with ${interval} minute intervals`);

  monitoringJob = cron.schedule(cronExpression, async () => {
    console.log('Running scheduled domain checks...');
    
    try {
      // Get all domains
      const result = await pool.query('SELECT * FROM domains ORDER BY id');
      const domains = result.rows;

      if (domains.length === 0) {
        console.log('No domains to check');
        return;
      }

      console.log(`Checking ${domains.length} domains...`);

      // Check all domains concurrently
      const checkPromises = domains.map(domain => 
        checkDomain(domain).catch(error => {
          console.error(`Error checking domain ${domain.name}:`, error);
          return null;
        })
      );

      const results = await Promise.all(checkPromises);
      const successfulChecks = results.filter(result => result !== null).length;
      
      console.log(`Completed ${successfulChecks}/${domains.length} domain checks`);
    } catch (error) {
      console.error('Error during scheduled monitoring:', error);
    }
  });

  console.log('Domain monitoring service started successfully');
};

const stopMonitoring = () => {
  if (monitoringJob) {
    monitoringJob.destroy();
    monitoringJob = null;
    console.log('Domain monitoring service stopped');
  }
};

module.exports = { startMonitoring, stopMonitoring };