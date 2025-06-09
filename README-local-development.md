# Local Development Instructions

This guide provides instructions on how to run the Brahmakumaris Centers application locally.

## Quick Start

For the fastest setup, run these commands:

```bash
# Build for local development
./build.sh local

# Start the application
npm run start-local

# Access at: http://localhost:5400
```

## Running Locally

To run the application locally without CORS issues:

1. Build the application for local development:
   ```bash
   ./build.sh local
   ```

2. Start the application (choose one option):
   ```bash
   npm run start-local
   ```
   or
   ```bash
   PORT=5400 IS_LOCAL=true npm run start
   ```

3. Access the application at:
   ```
   http://localhost:5400
   ```

## Development Mode (with hot reload)

For development with hot reload:

```bash
npm run dev-local
```

This will start the development server on port 5400 with local configuration.

## How It Works

When running locally with `IS_LOCAL=true`:

- The `basePath` is set to an empty string (instead of `/centers`)
- The `assetPrefix` is also set to an empty string, preventing CORS issues with fonts and other static assets
- The API endpoints use `http://localhost:5400` instead of the production URL with `/centers` path
- The application loads resources from the local server instead of trying to fetch them from the production URL

## Configuration Details

- **Port**: Local development uses port 5400 (same as production deployment)
- **Base Path**: Empty for local development (no `/centers` prefix)
- **API Endpoints**: Point to `http://localhost:5400/api/` for local development
- **Environment**: Set `IS_LOCAL=true` to enable local development mode

## Troubleshooting

### Centers not loading/populating

If the frontend loads but centers are not populating:

1. **Check the API endpoint**: Open browser dev tools and verify API calls are going to `http://localhost:5400/api/centers`
2. **Verify data file**: Ensure `Center-Processed.json` exists in the root directory
3. **Check environment variables**: Ensure `IS_LOCAL=true` is set
4. **Port consistency**: Make sure the app is running on port 5400

### Common Issues

- **Wrong port**: If accessing `localhost:3000`, redirect to `localhost:5400`
- **Base path errors**: Ensure `IS_LOCAL=true` is set to disable the `/centers` base path
- **API 404 errors**: Check that the API routes are accessible at `localhost:5400/api/`

## Switching Between Local and Production

- For local development: Use `./build.sh local` and `npm run start-local`
- For production deployment: Use the regular `./build.sh` script

This setup ensures that your application works correctly in both environments without CORS errors or path issues. 