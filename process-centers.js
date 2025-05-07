const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// File paths
const inputFile = path.join(__dirname, 'Center Locatore.json');
const outputFile = path.join(__dirname, 'Center-Processed.json');

// Batch processing config
const BATCH_SIZE = 10; // Process 10 centers at a time to avoid memory issues with large files

// Check for Google Maps API key
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️  GOOGLE_MAPS_API_KEY not found in environment variables!');
  console.warn('Centers without coordinates will not be geocoded.');
  console.warn('To enable geocoding:');
  console.warn('1. Copy .env-example to .env');
  console.warn('2. Add your Google Maps API key to the .env file');
}

// Fields to capitalize
const fieldsToCapitalize = [
  'name', 'region', 'state', 'district', 'country'
];

// Address fields to capitalize
const addressFieldsToCapitalize = [
  'line1', 'line2', 'line3', 'city'
];

// Fields to exclude
const fieldsToExclude = [
  'country_id', 'district_id', 'section', 'state_id', 'sub_zone', 'zone'
];

// Stats tracking
const stats = {
  totalCenters: 0,
  centersWithCoords: 0,
  centersWithoutCoords: 0,
  geocodingSuccessful: 0,
  geocodingFailed: 0
};

// Function to capitalize words in a string
function capitalizeString(str) {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Function to check if a center has valid coordinates
function hasValidCoordinates(center) {
  const isValid = Boolean(
    center?.coords && 
    Array.isArray(center.coords) &&
    center.coords.length === 2 &&
    !isNaN(parseFloat(center.coords[0])) &&
    !isNaN(parseFloat(center.coords[1]))
  );
  
  if (!isValid && center?.coords) {
    console.warn(`Invalid coordinates detected for ${center.name}:`, center.coords);
  }
  
  return isValid;
}

// Function to geocode an address using Google Maps Geocoding API
async function geocodeAddress(center) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY not found in environment variables');
    return null;
  }

  // Skip if address is missing
  if (!center.address) {
    console.warn(`Center ${center.name} (${center.branch_code}) has no address to geocode`);
    return null;
  }

  try {
    // Format the address as a single string
    const { line1, line2, line3, city, pincode } = center.address;
    const addressParts = [];
    
    if (line1) addressParts.push(line1);
    if (line2) addressParts.push(line2);
    if (line3) addressParts.push(line3);
    if (city) addressParts.push(city);
    if (pincode) addressParts.push(pincode);
    
    // Add state and country for better accuracy
    if (center.state) addressParts.push(center.state);
    if (center.country) addressParts.push(center.country);
    
    const addressString = addressParts.join(', ');
    
    if (!addressString) {
      console.warn(`Center ${center.name} (${center.branch_code}) has empty address components`);
      return null;
    }

    console.log(`Geocoding address for ${center.name}: ${addressString}`);

    // Add a small delay to avoid exceeding Google Maps API rate limits
    await new Promise(resolve => setTimeout(resolve, 300));

    // Make request to Google Maps Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: addressString,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const coords = [
        location.lat.toString(),
        location.lng.toString()
      ];
      console.log(`Successfully geocoded ${center.name}: ${coords[0]}, ${coords[1]}`);
      stats.geocodingSuccessful++;
      return coords;
    } else {
      console.warn(`Geocoding failed for address: ${addressString}`, response.data.status);
      stats.geocodingFailed++;
      return null;
    }
  } catch (error) {
    console.error('Error during geocoding:', error.message);
    stats.geocodingFailed++;
    return null;
  }
}

// Process centers in batches to handle large files
async function processCentersBatch(centers) {
  const processedCenters = [];
  
  for (let i = 0; i < centers.length; i += BATCH_SIZE) {
    const batch = centers.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(centers.length / BATCH_SIZE)} (centers ${i + 1}-${Math.min(i + BATCH_SIZE, centers.length)})`);
    
    const batchResults = await Promise.all(batch.map(center => processCenter(center)));
    processedCenters.push(...batchResults);
  }
  
  return processedCenters;
}

// Process the JSON file
async function processCentersData() {
  try {
    console.log('Reading input file...');
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    let processedData;
    
    // Check if the data is an array or an object with a data property
    if (Array.isArray(data)) {
      stats.totalCenters = data.length;
      console.log(`Processing ${stats.totalCenters} centers in batches of ${BATCH_SIZE}...`);
      const results = await processCentersBatch(data);
      processedData = results;
    } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
      stats.totalCenters = data.data.length;
      console.log(`Processing ${stats.totalCenters} centers in batches of ${BATCH_SIZE}...`);
      const results = await processCentersBatch(data.data);
      processedData = {
        ...data,
        data: results
      };
    } else {
      stats.totalCenters = 1;
      processedData = await processCenter(data);
    }
    
    console.log('Writing output file...');
    fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2), 'utf8');
    
    // Print stats summary
    console.log('\n--- Processing Summary ---');
    console.log(`Total centers processed: ${stats.totalCenters}`);
    console.log(`Centers with valid coordinates: ${stats.centersWithCoords}`);
    console.log(`Centers without coordinates: ${stats.centersWithoutCoords}`);
    console.log(`Successfully geocoded: ${stats.geocodingSuccessful}`);
    console.log(`Failed to geocode: ${stats.geocodingFailed}`);
    console.log(`Centers with coordinates in final output: ${stats.centersWithCoords + stats.geocodingSuccessful} (${((stats.centersWithCoords + stats.geocodingSuccessful) / stats.totalCenters * 100).toFixed(2)}%)`);
    console.log('------------------------\n');
    
    console.log('Processing complete! Output saved to', outputFile);
  } catch (error) {
    console.error('Error processing file:', error.message);
  }
}

// Function to process each center object
async function processCenter(center) {
  const processedCenter = {};
  
  // Process all fields in the center object
  for (const [key, value] of Object.entries(center)) {
    // Skip excluded fields
    if (fieldsToExclude.includes(key)) continue;
    
    // Handle address object specially
    if (key === 'address' && typeof value === 'object') {
      processedCenter[key] = processAddress(value);
    }
    // Capitalize specified fields
    else if (fieldsToCapitalize.includes(key) && typeof value === 'string') {
      processedCenter[key] = capitalizeString(value);
    } else {
      processedCenter[key] = value;
    }
  }
  
  // Check if coordinates are missing and geocode if necessary
  if (hasValidCoordinates(processedCenter)) {
    stats.centersWithCoords++;
  } else {
    stats.centersWithoutCoords++;
    console.log(`Center ${processedCenter.name} (${processedCenter.branch_code}) is missing valid coordinates. Attempting to geocode...`);
    const coords = await geocodeAddress(processedCenter);
    if (coords) {
      processedCenter.coords = coords;
      console.log(`Updated coordinates for ${processedCenter.name}: ${coords[0]}, ${coords[1]}`);
    } else {
      console.warn(`Could not geocode address for ${processedCenter.name}`);
    }
  }
  
  return processedCenter;
}

// Function to process address object
function processAddress(address) {
  if (!address || typeof address !== 'object') return address;
  
  const processedAddress = {};
  
  for (const [key, value] of Object.entries(address)) {
    if (addressFieldsToCapitalize.includes(key) && typeof value === 'string') {
      processedAddress[key] = capitalizeString(value);
    } else {
      processedAddress[key] = value;
    }
  }
  
  return processedAddress;
}

// Execute the processing
processCentersData(); 