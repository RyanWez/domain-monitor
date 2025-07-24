# Quick Start Guide

## Prerequisites
1. Install Node.js (v14+)
2. Install PostgreSQL OR Docker (for easy database setup)

## Setup Steps

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Set up database**
   
   **Option A: Using Docker (Easiest)**
   ```bash
   docker-compose up -d postgres
   ```
   
   **Option B: Manual PostgreSQL**
   - Install PostgreSQL
   - Create database: `CREATE DATABASE domain_monitor;`
   - Edit `.env` file with your credentials

3. **Configure environment** (if using manual PostgreSQL)
   - Edit `.env` file with your database credentials
   - Default config works with Docker setup

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## First Steps

1. **Register an account** at http://localhost:3000
2. **Add domains** to monitor from the dashboard
3. **Configure Telegram notifications** (optional) in Settings
4. **View reports** to see uptime statistics

## Default Monitoring

- Domains are checked every 5 minutes automatically
- Manual checks available via "Check Now" button
- Status changes trigger Telegram notifications (if configured)

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database `domain_monitor` exists

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 3000
- Change `PORT` in `.env` if needed

### Telegram Notifications Not Working
- Verify bot token and chat ID in Settings
- Use "Test Notification" button to verify setup
- Check server logs for error messages