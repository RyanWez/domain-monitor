# Domain Monitor - Vercel Deployment

## Quick Setup

### 1. Backend API Deployment
```bash
# From root directory
vercel --prod
```

### 2. Frontend Deployment  
```bash
cd client
vercel --prod
```

### 3. Update Frontend API URL
After backend deployment, update the API URL in:
- `client/vercel.json` 
- `client/build-for-vercel.js`

Replace with your actual backend URL from Vercel.

## Database Configuration

Using Neon.tech PostgreSQL:
- Connection string is already configured in `vercel.json`
- Database will auto-initialize on first API call

## Important Notes

1. **Monitoring Service**: Disabled for serverless deployment
   - Use manual check endpoint: `POST /api/monitor/check-all`
   
2. **CORS**: Configured for Vercel domains
   - Update `CORS_ORIGINS` in `vercel.json` with your actual frontend URL

3. **Environment Variables**: Set in Vercel dashboard or use `vercel.json`

## Testing

1. Test API: `https://your-api-domain.vercel.app/test`
2. Health check: `https://your-api-domain.vercel.app/api/health`
3. Manual domain check: `POST https://your-api-domain.vercel.app/api/monitor/check-all`

## Deployment Structure

```
Root (Backend API) → Vercel Project 1
├── api/index.js (Main API entry)
├── server/ (API logic)
└── vercel.json (Backend config)

client/ (Frontend) → Vercel Project 2  
├── src/ (React app)
├── vercel.json (Frontend config)
└── build-for-vercel.js (Build script)
```