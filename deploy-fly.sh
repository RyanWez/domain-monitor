#!/bin/bash

# Domain Monitor - Fly.io Deployment Script

echo "🚀 Starting deployment to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please login first:"
    echo "   fly auth login"
    exit 1
fi

# Build and deploy
echo "📦 Building and deploying application..."
fly deploy

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is available at: https://domain-monitor.fly.dev"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your database secrets:"
    echo "   fly secrets set DB_HOST=your-db-host"
    echo "   fly secrets set DB_NAME=your-db-name"
    echo "   fly secrets set DB_USER=your-db-user"
    echo "   fly secrets set DB_PASSWORD=your-db-password"
    echo "   fly secrets set JWT_SECRET=your-jwt-secret"
    echo ""
    echo "2. Check application logs:"
    echo "   fly logs"
    echo ""
    echo "3. Open your application:"
    echo "   fly open"
else
    echo "❌ Deployment failed!"
    exit 1
fi