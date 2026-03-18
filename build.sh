#!/bin/bash

# Exit on error
set -e

echo "===== Starting production deployment ====="

# Step 1: Pull latest code
echo "Pulling latest code..."
git pull

# Step 2: Install dependencies
echo "Installing dependencies..."
npm i

# Step 3: Generate sitemap (fetches from Strapi — requires STRAPI_TOKEN in .env)
echo "Generating sitemap..."
npm run generate-sitemap

# Step 4: Build the application
# Next.js automatically loads .env.production (STRAPI_BASE_URL, REVALIDATE_SECRET, NEXT_APP_URL)
echo "Building the application..."
npm run build

# Step 5: Restart PM2 (zero-downtime swap)
if pm2 list | grep -q "bkcenters"; then
    echo "Restarting existing PM2 process..."
    pm2 restart bkcenters
else
    echo "Starting application with PM2 on port 5400..."
    PORT=5400 pm2 start npm --name bkcenters -- start
fi

# Step 6: Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "===== Deployment completed successfully ====="
echo "Application is running on port 5400"
echo ""
echo "To update data without rebuilding, run: npm run strapi-sync"
