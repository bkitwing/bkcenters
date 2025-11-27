#!/bin/bash
# Quick script to update OAuth refresh token

if [ -z "$1" ]; then
    echo "Usage: ./update-token.sh <new_refresh_token>"
    exit 1
fi

NEW_TOKEN="$1"

# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update .env
sed -i "s|^OAUTH_REFRESH_TOKEN=.*|OAUTH_REFRESH_TOKEN=$NEW_TOKEN|" .env

# Update .env.local if exists
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    sed -i "s|^OAUTH_REFRESH_TOKEN=.*|OAUTH_REFRESH_TOKEN=$NEW_TOKEN|" .env.local
fi

echo "✓ Token updated. Now run: ./build.sh"

