# Domain Monitor - Deployment Guide

## 🚀 Fly.io Backend Deployment

### Prerequisites
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login to Fly.io: `fly auth login`
3. Have a PostgreSQL database ready

### Step 1: Deploy Application
```bash
# Deploy the application
fly deploy

# Or use the deployment script
npm run deploy:fly
```

### Step 2: Set Environment Variables
```bash
# Database configuration
fly secrets set DB_HOST=your-postgres-host
fly secrets set DB_NAME=your-database-name
fly secrets set DB_USER=your-database-user
fly secrets set DB_PASSWORD=your-database-password

# JWT Secret (generate a strong secret)
fly secrets set JWT_SECRET=your-super-secret-jwt-key

# Optional: Telegram configuration
fly secrets set TELEGRAM_BOT_TOKEN=your-bot-token
fly secrets set TELEGRAM_CHAT_ID=your-chat-id

# CORS Origins (add your frontend URL)
fly secrets set CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

### Step 3: Run Database Migration
```bash
# Connect to your app and run migration
fly ssh console
npm run migrate
exit
```

### Step 4: Verify Deployment
```bash
# Check application status
fly status

# View logs
fly logs

# Open application
fly open
```

## 🌐 Vercel Frontend Deployment

### Step 1: Prepare Frontend
1. Update `client/src/index.js` with your backend URL:
   ```javascript
   axios.defaults.baseURL = 'https://your-app.fly.dev';
   ```

2. Create `client/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "env": {
       "REACT_APP_API_URL": "https://your-app.fly.dev"
     }
   }
   ```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client folder
cd client

# Deploy
vercel

# Or connect GitHub repository to Vercel Dashboard
```

### Step 3: Configure Vercel
- Root Directory: `client`
- Framework Preset: `Create React App`
- Environment Variables:
  - `REACT_APP_API_URL`: `https://your-app.fly.dev`

## 🔧 Database Setup

### Option 1: Fly.io PostgreSQL
```bash
# Create PostgreSQL app
fly postgres create domain-monitor-db

# Attach to your main app
fly postgres attach --app domain-monitor domain-monitor-db
```

### Option 2: External PostgreSQL (Recommended)
Use services like:
- [Neon](https://neon.tech) - Free PostgreSQL
- [Supabase](https://supabase.com) - Free PostgreSQL
- [ElephantSQL](https://www.elephantsql.com) - Free PostgreSQL

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if database credentials are correct
   - Verify database is accessible from Fly.io
   - Check firewall settings

2. **CORS Errors**
   - Update CORS_ORIGINS environment variable
   - Include your frontend domain

3. **Health Check Failing**
   - Check if port 8080 is exposed
   - Verify database connection in health check

4. **Migration Errors**
   - Ensure database exists
   - Check database permissions
   - Run migration manually: `npm run migrate`

### Useful Commands
```bash
# View application logs
fly logs

# SSH into application
fly ssh console

# Check application status
fly status

# Scale application
fly scale count 1

# Restart application
fly restart
```

## 📊 Monitoring

### Health Check
Your application includes a health check endpoint at `/api/health` that:
- Tests database connectivity
- Returns application status
- Shows environment information

### Logs
Monitor your application using:
```bash
# Real-time logs
fly logs -f

# Recent logs
fly logs
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Database**: Use SSL connections in production
4. **CORS**: Only allow trusted domains
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

## 📈 Scaling

### Fly.io Scaling
```bash
# Scale to multiple instances
fly scale count 2

# Scale memory
fly scale memory 512

# Scale CPU
fly scale vm shared-cpu-2x
```

### Database Scaling
- Consider read replicas for heavy read workloads
- Use connection pooling for better performance
- Monitor database performance and optimize queries

## 🚀 Production Checklist

- [ ] Database is set up and accessible
- [ ] All environment variables are configured
- [ ] Database migration has been run
- [ ] Health check is passing
- [ ] Frontend is deployed and connected to backend
- [ ] CORS is properly configured
- [ ] Telegram notifications are working (if configured)
- [ ] Domain monitoring is running
- [ ] Logs are being monitored
- [ ] Backup strategy is in place

## 📞 Support

If you encounter issues:
1. Check the logs: `fly logs`
2. Verify environment variables: `fly secrets list`
3. Test health check: `curl https://your-app.fly.dev/api/health`
4. Check database connectivity
5. Review this deployment guide