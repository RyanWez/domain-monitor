const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const groupRoutes = require('./routes/groups');
const settingsRoutes = require('./routes/settings');
const { initDatabase } = require('./database/init');
const { startMonitoring } = require('./services/monitor');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('./database/init');
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
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

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');

    // Start monitoring service
    startMonitoring();
    console.log('Domain monitoring service started');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend should be accessible at http://localhost:3000`);
      console.log(`API accessible at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('\n=== SETUP REQUIRED ===');
    console.error('1. Install and start PostgreSQL');
    console.error('2. Create database: CREATE DATABASE domain_monitor;');
    console.error('3. Update .env file with correct database credentials');
    console.error('4. Restart the server');
    console.error('=====================\n');
    process.exit(1);
  }
}

startServer();