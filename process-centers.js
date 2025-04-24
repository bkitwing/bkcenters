const fs = require('fs');
const path = require('path');

// File paths
const inputFile = path.join(__dirname, 'Center Locatore.json');
const outputFile = path.join(__dirname, 'Center-Processed.json');

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

// Function to capitalize words in a string
function capitalizeString(str) {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Process the JSON file
try {
  console.log('Reading input file...');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  let processedData;
  
  // Check if the data is an array or an object with a data property
  if (Array.isArray(data)) {
    processedData = data.map(processCenter);
  } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
    processedData = {
      ...data,
      data: data.data.map(processCenter)
    };
  } else {
    processedData = processCenter(data);
  }
  
  console.log('Writing output file...');
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2), 'utf8');
  console.log('Processing complete! Output saved to', outputFile);
} catch (error) {
  console.error('Error processing file:', error.message);
}

// Function to process each center object
function processCenter(center) {
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