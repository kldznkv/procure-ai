#!/bin/bash

# ProcureAI Deployment Script
echo "🚀 Starting ProcureAI deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found."
    exit 1
fi

# Check if next.config.js exists
if [ ! -f "next.config.js" ]; then
    echo "❌ Error: next.config.js not found."
    exit 1
fi

echo "✅ All required files found."

# Build the application locally to test
echo "🔨 Building application locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
    echo "🚀 Ready for deployment to Railway!"
    echo ""
    echo "Next steps:"
    echo "1. Go to Railway dashboard"
    echo "2. Connect to the 'railway-deploy' branch"
    echo "3. Set environment variables"
    echo "4. Deploy!"
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi
