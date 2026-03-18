const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
  trailingSlash: false,
  // basePath is always /centers — same in dev and prod
  basePath: "/centers",
  // Asset prefix: production serves from CDN domain, dev uses local
  assetPrefix: isProd ? "https://www.brahmakumaris.com/centers" : "",
  experimental: {
    strictNextHead: true,
  },
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
};

module.exports = nextConfig;
