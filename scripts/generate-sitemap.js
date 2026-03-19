const fs = require('fs');
const path = require('path');
const https = require('https');
const prettier = require('prettier');
require('dotenv').config();

// Base URL for the website
const BASE_URL = 'https://www.brahmakumaris.com/centers';

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

function parseBaseUrl(url) {
  const parsed = new URL(url);
  return { hostname: parsed.hostname, basePath: parsed.pathname.replace(/\/$/, '') };
}

function strapiGet(endpoint) {
  const { hostname, basePath } = parseBaseUrl(STRAPI_BASE_URL);
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path: basePath + '/' + endpoint,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + STRAPI_TOKEN },
      timeout: 30000
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`Parse error: ${d.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

async function fetchAllCenters() {
  let all = [];
  let page = 1;
  const pop = 'populate=district_center.state_center.region_center';
  while (true) {
    const res = await strapiGet(`centers?${pop}&pagination[page]=${page}&pagination[pageSize]=100`);
    all = all.concat(res.data || []);
    if (page >= (res.meta?.pagination?.pageCount || 0)) break;
    page++;
  }
  return all.map(entry => {
    const a = entry.attributes;
    const district = a.district_center?.data?.attributes;
    const state = district?.state_center?.data?.attributes;
    const region = state?.region_center?.data?.attributes;
    return {
      name: a.name || '',
      slug: a.slug || (a.name || '').toLowerCase().replace(/\s+/g, '-'),
      branch_code: a.branch_code || '',
      region: region?.name || '',
      state: state?.name || '',
      district: district?.name || '',
    };
  });
}

async function generateSitemap() {
  console.log('Generating sitemap from Strapi...');
  
  if (!STRAPI_BASE_URL || !STRAPI_TOKEN) {
    console.error('Missing STRAPI_BASE_URL or STRAPI_TOKEN in .env');
    process.exit(1);
  }

  const centers = await fetchAllCenters();
  console.log(`Loaded ${centers.length} centers from Strapi`);
  
  const dataLastmod = new Date().toISOString();
  
  // Extract all regions, states, districts
  const regions = new Set();
  const states = new Map(); // state -> region
  const districts = new Map(); // `${state}:${district}` -> state
  
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
  
  // Add center pages - using center name as the final URL segment
  centers.forEach((center) => {
    const { region, state, district, name } = center;
    
    if (region && state && district && name) {
      const regionSlug = encodeURIComponent(region.toLowerCase().replace(/\s+/g, '-'));
      const stateSlug = encodeURIComponent(state.toLowerCase().replace(/\s+/g, '-'));
      const districtSlug = encodeURIComponent(district.toLowerCase().replace(/\s+/g, '-'));
      // Use the slug stored in Strapi (set by sync script)
      const centerSlug = encodeURIComponent(center.slug);
      
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
    <lastmod>${dataLastmod}</lastmod>
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

# Block form submission endpoint only - not needed by crawlers
Disallow: /api/send-email

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