# Local Development Instructions

This guide provides instructions on how to run the Brahmakumaris Centers application locally.

## Running Locally

To run the application locally without CORS issues:

1. Build the application for local development:
   ```bash
   ./build.sh local
   ```

2. Start the application:
   ```bash
   IS_LOCAL=true npm run start
   ```
   or
   ```bash
   npm run start-local
   ```

3. Access the application at:
   ```
   http://localhost:5400
   ```

## How It Works

When running locally:

- The `basePath` is set to an empty string (instead of `/centers`)
- The `assetPrefix` is also set to an empty string, preventing CORS issues with fonts and other static assets
- The application loads resources from the local server instead of trying to fetch them from the production URL

## Switching Between Local and Production

- For local development: Use `./build.sh local` and `npm run start-local`
- For production deployment: Use the regular `./build.sh` script

This setup ensures that your application works correctly in both environments without CORS errors or path issues. 