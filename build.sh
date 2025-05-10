#!/bin/bash

# Exit on error
set -e

# Check if script is running in local development mode
if [ "$1" = "local" ]; then
  IS_LOCAL=true
  echo "===== Building for local development ====="
else
  IS_LOCAL=false
  echo "===== Building for production deployment ====="
fi

echo "===== Starting deployment process ====="

# Step 1: Install dependencies
echo "Installing dependencies..."
npm i

# Step 2: Generate sitemap and robots.txt
echo "Generating sitemap and robots.txt..."
npm run generate-sitemap

# Step 3: Build the application
echo "Building the application..."
if [ "$IS_LOCAL" = true ]; then
  IS_LOCAL=true npm run build
else
  npm run build
fi

# Step 4: Check if this is a local build
if [ "$IS_LOCAL" = true ]; then
  echo "===== Local build completed successfully ====="
  echo "Run 'IS_LOCAL=true npm run start' to start the application"
  exit 0
fi

# Step 5: Check if PM2 process exists and stop it
if pm2 list | grep -q "bkcenters"; then
    echo "Stopping existing PM2 process..."
    pm2 stop bkcenters
    pm2 delete bkcenters
fi

# Step 6: Start the application with PM2 on port 5400
echo "Starting application with PM2 on port 5400..."
PORT=5400 pm2 start npm --name bkcenters -- start

# Step 7: Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "===== Deployment completed successfully ====="
echo "Application is running on port 5400" 
