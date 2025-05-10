# Sitemap & Robots.txt Implementation

This document provides information about the automated sitemap generation and robots.txt configuration for the Brahma Kumaris Centers web application.

## Overview

The website includes a dynamic sitemap generator that creates:
1. A `sitemap.xml` file containing URLs for all pages in the application
2. A `robots.txt` file with rules for search engines and AI bots

Both files are generated during the build process and placed in the `/public` directory.

## How it Works

The sitemap generation process follows these steps:

1. When `build.sh` runs, it executes the `generate-sitemap` npm script
2. The script loads center data from `Center-Processed.json`
3. It identifies all regions, states, districts, and centers
4. It generates URLs for all entities with appropriate priorities and change frequencies
5. The sitemap.xml and robots.txt files are written to the public directory
6. During the Next.js build, these files are included in the output

## URL Structure

The sitemap includes URLs with the following pattern:
- Homepage: `https://www.brahmakumaris.com/centers`
- Retreat page: `https://www.brahmakumaris.com/centers/retreat`
- Region pages: `https://www.brahmakumaris.com/centers/{region-slug}`
- State pages: `https://www.brahmakumaris.com/centers/{region-slug}/{state-slug}`
- District pages: `https://www.brahmakumaris.com/centers/{region-slug}/{state-slug}/{district-slug}`
- Center pages: `https://www.brahmakumaris.com/centers/{region-slug}/{state-slug}/{district-slug}/{branch-code}`

## Dynamic Updates

The sitemap is automatically regenerated during each build, ensuring that:
- New centers are automatically included
- Changes to regions, states, or districts are reflected
- Removed centers are no longer included

## Robots.txt Configuration

The robots.txt file allows:
- All search engine crawlers (Google, Bing, Yahoo, DuckDuckGo, Baidu, Yandex)
- AI bots (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, Bytespider)
- It blocks URLs with query parameters to avoid duplicate content

## Manual Generation

To manually generate the sitemap and robots.txt files:

```bash
npm run generate-sitemap
```

## Troubleshooting

If you encounter issues with the sitemap:

1. Check that the `Center-Processed.json` file exists either in the root or `/public` directory
2. Verify that the file contains valid JSON data with a `data` array
3. Ensure each center has `region`, `state`, `district`, and `branch_code` fields
4. Check the console output during the build process for any errors

## SEO Best Practices

- The sitemap includes all pages with appropriate priority values
- The `changefreq` values reflect how often content changes
- `lastmod` dates are set to the build date
- The sitemap URL is properly referenced in robots.txt 