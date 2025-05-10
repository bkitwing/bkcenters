const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

// Base URL for the website
const BASE_URL = 'https://www.brahmakumaris.com/centers';

async function generateSitemap() {
  console.log('Generating sitemap...');
  
  // Try to find the centers data file
  const publicFilePath = path.join(process.cwd(), 'public', 'Center-Processed.json');
  const rootFilePath = path.join(process.cwd(), 'Center-Processed.json');
  
  let filePath;
  if (fs.existsSync(publicFilePath)) {
    filePath = publicFilePath;
    console.log('Using data file from public directory');
  } else if (fs.existsSync(rootFilePath)) {
    filePath = rootFilePath;
    console.log('Using data file from root directory');
  } else {
    console.error('Centers data file not found in any location');
    throw new Error('Centers data file not found in any location');
  }
  
  // Read and parse the file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  
  if (!data || !data.data || !Array.isArray(data.data)) {
    console.error('Invalid data structure in centers file');
    throw new Error('Invalid data structure in centers file');
  }
  
  console.log(`Loaded ${data.data.length} centers from file`);
  
  // Extract all regions, states, districts, and centers
  const regions = new Set();
  const states = new Map(); // state -> region
  const districts = new Map(); // `${state}:${district}` -> state
  const centers = data.data;
  
  // Process centers to build mappings
  centers.forEach((center) => {
    const { region, state, district, branch_code } = center;
    
    if (region) {
      regions.add(region);
    }
    
    if (state) {
      states.set(state, region || '');
      
      if (district) {
        const key = `${state}:${district}`;
        districts.set(key, state);
      }
    }
  });
  
  console.log(`Found ${regions.size} regions, ${states.size} states, ${districts.size} districts`);
  
  // Generate URLs
  const urls = [
    // Homepage
    { url: `${BASE_URL}`, changefreq: 'daily', priority: 1.0 },
    // Retreat centers page
    { url: `${BASE_URL}/retreat`, changefreq: 'weekly', priority: 0.9 },
  ];
  
  // Add region pages
  regions.forEach((region) => {
    const regionSlug = encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'));
    urls.push({
      url: `${BASE_URL}/${regionSlug}`,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });
  
  // Add state pages
  states.forEach((region, state) => {
    const regionSlug = encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'));
    const stateSlug = encodeURIComponent(state.toLowerCase().replace(/\s+/g, '-'));
    urls.push({
      url: `${BASE_URL}/${regionSlug}/${stateSlug}`,
      changefreq: 'weekly',
      priority: 0.7,
    });
  });
  
  // Add district pages
  districts.forEach((state, districtKey) => {
    const [stateName, districtName] = districtKey.split(':');
    const region = states.get(stateName) || '';
    const regionSlug = encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'));
    const stateSlug = encodeURIComponent(stateName.toLowerCase().replace(/\s+/g, '-'));
    const districtSlug = encodeURIComponent(districtName.toLowerCase().replace(/\s+/g, '-'));
    
    urls.push({
      url: `${BASE_URL}/${regionSlug}/${stateSlug}/${districtSlug}`,
      changefreq: 'weekly',
      priority: 0.6,
    });
  });
  
  // Add center pages - using center name instead of branch code
  centers.forEach((center) => {
    const { region, state, district, name } = center;
    
    if (region && state && district && name) {
      const regionSlug = encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'));
      const stateSlug = encodeURIComponent(state.toLowerCase().replace(/\s+/g, '-'));
      const districtSlug = encodeURIComponent(district.toLowerCase().replace(/\s+/g, '-'));
      // Convert center name to URL-friendly slug
      const centerSlug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
      
      urls.push({
        url: `${BASE_URL}/${regionSlug}/${stateSlug}/${districtSlug}/${centerSlug}`,
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  });
  
  console.log(`Generated ${urls.length} URLs for sitemap`);
  
  // Create sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => `  <url>
    <loc>${url.url}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`)
  .join('\n')}
</urlset>`;
  
  // Format the XML with prettier
  const formattedSitemap = await prettier.format(sitemap, { parser: 'html' });
  
  // Create the output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the sitemap to file
  const outputPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(outputPath, formattedSitemap);
  
  console.log(`Sitemap written to ${outputPath}`);
  
  // Create robots.txt
  const robotsTxt = `# robots.txt for brahmakumaris.com/centers
User-agent: *
Allow: /

# Allow all search engines to access the site
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Slurp
Allow: /
User-agent: DuckDuckBot
Allow: /
User-agent: Baiduspider
Allow: /
User-agent: Yandex
Allow: /

# Allow AI bots
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Bytespider
Allow: /

# Block all parameters to avoid duplicate content
Disallow: /*?*

# Sitemaps
Sitemap: https://www.brahmakumaris.com/centers/sitemap.xml
`;
  
  // Write robots.txt to file
  const robotsPath = path.join(outputDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  
  console.log(`Robots.txt written to ${robotsPath}`);
}

// Run the script
generateSitemap().catch((err) => {
  console.error('Error generating sitemap:', err);
  process.exit(1);
}); 