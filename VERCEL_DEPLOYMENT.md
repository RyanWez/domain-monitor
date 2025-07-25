# Vercel Deployment Guide

## Backend API Deployment

1. Deploy the backend API:
   ```bash
   # From root directory
   vercel --prod
   ```
   - This will deploy the API to something like `https://domain-monitor-api.vercel.app`

## Frontend Deployment

1. Deploy the frontend:
   ```bash
   # From client directory
   cd client
   vercel --prod
   ```
   - This will deploy the frontend to something like `https://domain-monitor-frontend.vercel.app`

## Environment Variables

Make sure to set these environment variables in Vercel dashboard:

### Backend API Environment Variables:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://neondb_owner:npg_VYw4Lc9DNCma@ep-shy-water-a13coboj-pooler.ap-southeast-1.aws.neon.tech/domain_monitor?sslmode=require`
- `JWT_SECRET=7fd93f7da90352d82b92dd15`
- `CHECK_INTERVAL_MINUTES=5`
- `TELEGRAM_BOT_TOKEN=8083109629:AAEKsfuFz5fUQdSn4uddYkSe3R70UbMNDHg`
- `TELEGRAM_CHAT_ID=-4936044808`
- `CORS_ORIGINS=https://domain-monitor-frontend.vercel.app,http://localhost:3000`

### Frontend Environment Variables:
- `REACT_APP_API_URL=https://domain-monitor-api.vercel.app`

## Important Notes:

1. **Two Separate Deployments**: Deploy backend and frontend as separate Vercel projects
2. **Update API URL**: After backend deployment, update the `REACT_APP_API_URL` in frontend
3. **CORS Configuration**: Make sure to update CORS_ORIGINS with your actual frontend URL
4. **Database**: Using Neon.tech PostgreSQL database (already configured)

## Deployment Commands:

```bash
# Deploy backend
vercel --prod

# Deploy frontend
cd client
vercel --prod
```