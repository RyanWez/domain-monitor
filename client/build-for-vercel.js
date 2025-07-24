const fs = require('fs');
const path = require('path');

// Create .env file for production build
const envContent = `
REACT_APP_API_URL=https://domain-monitor.fly.dev
`;

fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);

console.log('Created .env.production file for Vercel deployment');