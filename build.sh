#!/bin/bash

# Exit on error
set -e

echo "===== Starting production deployment ====="

# Step 1: Pull latest code
#echo "Pulling latest code..."
#git pull

# Step 2: Install dependencies
echo "Installing dependencies..."
npm i

# Step 3: Sitemap (optional — skipped by default so deploys don't wait on Strapi crawl)
# Keeps the existing public/sitemap.xml from the last successful generate.
# Regenerate separately: npm run generate-sitemap
# Or after data sync: npm run strapi-sync (runs sitemap at the end)
# Force during deploy: GENERATE_SITEMAP=1 ./build.sh
if [ "${GENERATE_SITEMAP:-0}" = "1" ]; then
  echo "Generating sitemap (GENERATE_SITEMAP=1)..."
  npm run generate-sitemap || echo "WARNING: sitemap generation failed — keeping existing public/sitemap.xml"
else
  echo "Skipping Strapi sitemap crawl (use GENERATE_SITEMAP=1 to run, or npm run generate-sitemap)."
fi

# Step 4: Build the application
# Next.js loads .env (base config) + .env.production (overrides STRAPI_BASE_URL, NEXT_APP_URL)
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
echo "To refresh sitemap.xml, run: npm run generate-sitemap"
