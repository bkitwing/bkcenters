const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["maps.googleapis.com"],
  },
  // Set trailing slashes to false to avoid duplicate routes
  trailingSlash: false,
  // Add basePath for deployment at /centers
  basePath: "/centers",
  // Configure asset prefix to match basePath
  assetPrefix: isProd ? "https://www.brahmakumaris.com/centers" : undefined,
  // Configure page build options
  experimental: {
    // Disable strict mode during build to avoid duplicate effects
    strictNextHead: true,
  },
  // Enable edge runtime for OpenGraph image generation
  webpack(config) {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    });
    return config;
  },
  // Register public files that won't be processed by Next.js
  // This ensures sitemap.xml and robots.txt are served correctly
  async rewrites() {
    return [
      {
        source: '/centers/sitemap.xml',
        destination: '/centers/sitemap.xml',
      },
      {
        source: '/centers/robots.txt',
        destination: '/centers/robots.txt',
      },
    ];
  },
};

module.exports = nextConfig;
