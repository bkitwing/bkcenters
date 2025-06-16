# Setting up OAuth 2.0 for Gmail API

This document contains step-by-step instructions for configuring OAuth 2.0 credentials to use with the Gmail API for the contact form functionality.

## 1. Create OAuth 2.0 credentials in Google Cloud Console

1. Log in to Google Cloud Console with admin@bkitwing.org at https://console.cloud.google.com
2. Navigate to your project (bkp-youzer-sso)
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Set the application type to "Web application"
6. Name your OAuth client (e.g., "BK Centers Email Service")
7. Add authorized redirect URIs:
   - https://www.brahmakumaris.com/centers/api/auth/callback/google
   - http://localhost:5400/api/auth/callback/google (for development)
   - https://developers.google.com/oauthplayground (for getting the refresh token)
8. Click "Create"
9. Note the Client ID and Client Secret that are generated

## 2. Enable Gmail API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Gmail API" and select it
3. Click "Enable"

## 3. Generate a Refresh Token

1. Go to https://developers.google.com/oauthplayground/
2. Click the settings icon (gear icon) in the top right corner
3. Check "Use your own OAuth credentials"
4. Enter your OAuth client ID and client secret from step 1
5. Close the settings panel
6. In the left panel, under "Select & authorize APIs", find "Gmail API v1" and select the following scope:
   - https://mail.google.com/
7. Click "Authorize APIs"
8. Sign in with admin@bkitwing.org when prompted
9. Grant the requested permissions
10. You will be redirected back to the OAuth Playground
11. Click "Exchange authorization code for tokens"
12. Note the refresh token from the response

## 4. Update Environment Variables

Create or update the `.env.local` file in your project root with the following variables:

```
# OAuth credentials for Gmail API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
OAUTH_REFRESH_TOKEN=your_refresh_token_here
EMAIL_FROM=admin@bkitwing.org

# Keep existing variables
NEXT_PUBLIC_BASE_PATH=/centers
NODE_ENV=production
```

## 5. Rebuild and Deploy

After setting up the environment variables, rebuild and deploy the application using the build script:

```bash
./build.sh
```

## Troubleshooting

If you encounter any issues:

1. Verify that the Gmail API is enabled in your Google Cloud project
2. Ensure that the OAuth client has the correct redirect URIs
3. Check that you've granted the correct scopes when generating the refresh token
4. Verify that the email address (admin@bkitwing.org) has sufficient permissions in your Google Workspace
5. Check the server logs for specific error messages

## Security Notes

- Refresh tokens do not expire until explicitly revoked
- Keep your client ID, client secret, and refresh token secure
- If you believe your credentials have been compromised, revoke them in the Google Cloud Console and generate new ones
- Consider rotating credentials periodically as a security best practice 