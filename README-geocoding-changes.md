# Geocoding Changes

The application has been modified to use server-side geocoding during data preprocessing rather than client-side on-the-fly geocoding.

## Changes Made

1. **Preprocessing Script**
   - The `process-centers.js` script now geocodes all centers without coordinates
   - Centers are processed in batches with proper error handling
   - Results are saved to `Center-Processed.json` which includes latitude/longitude for all centers

2. **Client-side Geocoding Removed**
   - Removed geocoding functionality from `MapSection` and `RetreatCenterMap` components
   - Updated `CenterMap` component to remove geocoding logic
   - Updated `getNearestCenters` in `centerData.ts` to rely on preprocessed coordinates
   - Modified `geocoding.ts` to keep validation functions but disable actual geocoding

## Benefits

- **Better Performance**: No more delay waiting for geocoding API responses
- **Reduced API Usage**: Geocoding is done once during preprocessing, not on every page load
- **Improved Reliability**: Maps display immediately with coordinates from the data
- **Better User Experience**: No more waiting for coordinates to load

## Implementation

1. **For New Centers**:
   - Run the `process-centers.js` script to update coordinates in the data file
   - Command: `npm run process-centers`

2. **Required Setup**:
   - Create a `.env` file with Google Maps API key (copy from `.env-example`)
   - Install dependencies: `npm install axios dotenv`

## Technical Details

The preprocessing script:
- Reads centers from `Center Locatore.json`
- Identifies centers without coordinates
- Uses Google Maps Geocoding API to find coordinates
- Updates the data with the new coordinates
- Saves to `Center-Processed.json`

This client-side code has been updated to no longer perform geocoding, relying on the preprocessed data instead. 