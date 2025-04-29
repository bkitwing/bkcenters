/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['maps.googleapis.com'],
  },
  // Set trailing slashes to false to avoid duplicate routes
  trailingSlash: false,
  // Configure page build options
  experimental: {
    // Disable strict mode during build to avoid duplicate effects
    strictNextHead: true,
  },
};

module.exports = nextConfig;
