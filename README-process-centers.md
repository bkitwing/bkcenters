# Centers Data Processing Script

This script processes the BK Centers data and adds geocoding for centers that don't have latitude and longitude coordinates.

## Features

- Capitalizes center names, regions, states, districts, and countries
- Capitalizes address fields
- Filters out unnecessary fields
- **Geocodes centers without coordinates** using Google Maps Geocoding API
- Processes centers in batches to handle large files efficiently
- Provides detailed processing statistics

## Prerequisites

- Node.js (v14+)
- Google Maps API key with Geocoding API enabled

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the environment example file and add your Google Maps API key:
   ```
   cp .env-example .env
   ```

3. Edit the `.env` file and add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. Make sure you have the input JSON file at the expected location: `Center Locatore.json`

## Usage

Run the processing script:

```
npm run process-centers
```

Or directly:

```
node process-centers.js
```

## Output

The script will:
1. Read the centers from `Center Locatore.json`
2. Process each center (capitalize fields, process addresses)
3. Geocode centers that don't have coordinates
4. Save the result to `Center-Processed.json`
5. Display processing statistics

## Batch Processing

The script processes centers in batches of 10 (configurable) to:
- Reduce memory consumption for large datasets
- Handle API rate limiting more effectively
- Provide better progress visibility

You can adjust the batch size by changing the `BATCH_SIZE` constant in the script.

## Statistics

After processing, the script will display statistics including:
- Total centers processed
- Centers with existing coordinates
- Centers without coordinates
- Successfully geocoded centers
- Failed geocoding attempts
- Final percentage of centers with coordinates

## Troubleshooting

- **Missing API Key**: If you see warnings about missing Google Maps API key, ensure your `.env` file is set up correctly
- **API Limit Exceeded**: If you get rate limit errors, the script includes a delay between requests, but you may need a higher-tier API key for processing large datasets
- **Failed Geocoding**: Some addresses may not be found - review the specific address format to ensure it's complete
- **Memory Issues**: If you experience memory problems with very large files, try reducing the `BATCH_SIZE` in the script 