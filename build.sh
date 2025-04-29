#!/bin/bash

# Exit on error
set -e

echo "===== Starting deployment process ====="

# Step 1: Install dependencies
echo "Installing dependencies..."
npm i

# Step 2: Build the application
echo "Building the application..."
npm run build

# Step 3: Check if PM2 process exists and stop it
if pm2 list | grep -q "bkcenters"; then
    echo "Stopping existing PM2 process..."
    pm2 stop bkcenters
    pm2 delete bkcenters
fi

# Step 4: Start the application with PM2 on port 5040
echo "Starting application with PM2 on port 5040..."
PORT=5040 pm2 start npm --name bkcenters -- start

# Step 5: Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "===== Deployment completed successfully ====="
echo "Application is running on port 5040" 