#!/bin/bash

# Script to set up environment variables for Gmail OAuth
# This script will update your .env.local file with the provided OAuth credentials

# Color codes for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Gmail OAuth Setup Script${NC}"
echo "This script will update your .env.local file with Gmail OAuth credentials."
echo "Please follow the OAUTH-SETUP-INSTRUCTIONS.md file first to obtain your credentials."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local file not found!${NC}"
    echo "Creating a new .env.local file..."
    touch .env.local
fi

# Backup existing file
cp .env.local .env.local.backup
echo -e "${GREEN}Backup created: .env.local.backup${NC}"

# Ask for the credentials
read -p "Enter the Google Client ID: " client_id
read -p "Enter the Google Client Secret: " client_secret
read -p "Enter the OAuth Refresh Token: " refresh_token
read -p "Enter the Email From address (default: admin@bkitwing.org): " email_from
email_from=${email_from:-admin@bkitwing.org}

# Read the existing file content
existing_content=$(cat .env.local)

# Remove existing OAuth credentials if they exist
existing_content=$(echo "$existing_content" | grep -v "GOOGLE_CLIENT_ID")
existing_content=$(echo "$existing_content" | grep -v "GOOGLE_CLIENT_SECRET")
existing_content=$(echo "$existing_content" | grep -v "OAUTH_REFRESH_TOKEN")
existing_content=$(echo "$existing_content" | grep -v "EMAIL_FROM")

# Add the new credentials
echo "$existing_content" > .env.local
echo "" >> .env.local
echo "# OAuth credentials for Gmail API" >> .env.local
echo "GOOGLE_CLIENT_ID=$client_id" >> .env.local
echo "GOOGLE_CLIENT_SECRET=$client_secret" >> .env.local
echo "OAUTH_REFRESH_TOKEN=$refresh_token" >> .env.local
echo "EMAIL_FROM=$email_from" >> .env.local

echo -e "${GREEN}OAuth credentials have been added to .env.local${NC}"
echo "To apply these changes, please rebuild the application using:"
echo "./build.sh" 