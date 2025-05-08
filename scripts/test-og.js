const http = require('http');
const cheerio = require('cheerio');

const testUrl = 'http://localhost:3000/centers';

function testOgTags() {
  http.get(testUrl, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      const $ = cheerio.load(data);
      
      console.log('\n=== OpenGraph Tags Test Results ===\n');
      
      // Test basic meta tags
      const title = $('meta[property="og:title"]').attr('content');
      const description = $('meta[property="og:description"]').attr('content');
      const image = $('meta[property="og:image"]').attr('content');
      const url = $('meta[property="og:url"]').attr('content');
      const type = $('meta[property="og:type"]').attr('content');
      
      // Test Twitter Card tags
      const twitterCard = $('meta[name="twitter:card"]').attr('content');
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      const twitterDescription = $('meta[name="twitter:description"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      
      console.log('OpenGraph Tags:');
      console.log('- Title:', title || 'Missing ❌');
      console.log('- Description:', description || 'Missing ❌');
      console.log('- Image:', image || 'Missing ❌');
      console.log('- URL:', url || 'Missing ❌');
      console.log('- Type:', type || 'Missing ❌');
      
      console.log('\nTwitter Card Tags:');
      console.log('- Card:', twitterCard || 'Missing ❌');
      console.log('- Title:', twitterTitle || 'Missing ❌');
      console.log('- Description:', twitterDescription || 'Missing ❌');
      console.log('- Image:', twitterImage || 'Missing ❌');
      
      console.log('\nStatus:');
      const allTagsPresent = title && description && image && url && type && 
                            twitterCard && twitterTitle && twitterDescription && twitterImage;
      
      if (allTagsPresent) {
        console.log('✅ All required OpenGraph and Twitter Card tags are present');
      } else {
        console.log('❌ Some required tags are missing');
      }
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

// Run the test
console.log('Testing OpenGraph tags on:', testUrl);
testOgTags(); 