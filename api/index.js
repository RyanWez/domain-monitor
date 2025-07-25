const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('../server/routes/auth');
const domainRoutes = require('../server/routes/domains');
const groupRoutes = require('../server/routes/groups');
const settingsRoutes = require('../server/routes/settings');
const { initDatabase } = require('../server/database/init');

// Note: Monitoring service is disabled for Vercel serverless deployment
// Manual checks can still be triggered via API endpoints

const app = express();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for Vercel
app.use(cors({
  origin: [
    'https://domain-monitor-client.vercel.app',
    'http://localhost:3000',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize database on first request
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('../server/database/init');
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (err) {
    console.error('Health check database error:', err);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Domain Monitor API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API Test Successful',
    cors: 'CORS should be working',
    database: 'Database connection will be tested on first API call'
  });
});

// Manual monitoring trigger endpoint
app.post('/api/monitor/check-all', async (req, res) => {
  try {
    const { pool } = require('../server/database/init');
    const { checkDomain } = require('../server/services/checker');
    
    // Get all domains
    const result = await pool.query('SELECT * FROM domains ORDER BY id');
    const domains = result.rows;

    if (domains.length === 0) {
      return res.json({ message: 'No domains to check', checked: 0 });
    }

    // Check all domains concurrently
    const checkPromises = domains.map(domain => 
      checkDomain(domain).catch(error => {
        console.error(`Error checking domain ${domain.name}:`, error);
        return null;
      })
    );

    const results = await Promise.all(checkPromises);
    const successfulChecks = results.filter(result => result !== null).length;
    
    res.json({
      message: 'Manual domain check completed',
      total: domains.length,
      successful: successfulChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during manual monitoring:', error);
    res.status(500).json({ error: 'Failed to check domains' });
  }
});

module.exports = app;