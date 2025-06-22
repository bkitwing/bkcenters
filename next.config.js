const isProd = process.env.NODE_ENV === "production";
const isLocalDev = process.env.IS_LOCAL === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["maps.googleapis.com"],
  },
  // Set trailing slashes to false to avoid duplicate routes
  trailingSlash: false,
  // Add basePath for deployment at /centers (only in production mode)
  basePath: isProd && !isLocalDev ? "/centers" : "",
  // Configure asset prefix to match basePath
  assetPrefix: isProd && !isLocalDev ? "https://www.brahmakumaris.com/centers" : "",
  // Configure page build options
  experimental: {
    // Disable strict mode during build to avoid duplicate effects
    strictNextHead: true,
  },
  // Configure webpack to handle fonts properly
  webpack(config) {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name][ext]',
      },
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
      // Add this rewrite to ensure API routes work correctly with basePath
      ...(isProd && !isLocalDev ? [
        {
          source: '/centers/api/:path*',
          destination: '/api/:path*',
        }
      ] : [])
    ];
  },
};

module.exports = nextConfig;
