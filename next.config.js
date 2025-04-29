const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["maps.googleapis.com"],
  },
  // Set trailing slashes to false to avoid duplicate routes
  trailingSlash: false,
  // Add basePath for deployment at /bkcenters
  basePath: "/bkcenters",
  // Configure asset prefix to match basePath
  assetPrefix: isProd ? "https://www.brahmakumaris.com/bkcenters" : undefined,
  // Configure page build options
  experimental: {
    // Disable strict mode during build to avoid duplicate effects
    strictNextHead: true,
  },
};

module.exports = nextConfig;
