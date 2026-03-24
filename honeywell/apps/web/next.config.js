/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lles-ma.com',
      },
      {
        protocol: 'https',
        hostname: '*.lles-ma.com',
      },
    ],
  },
  transpilePackages: [
    '@honeywell/config',
    '@honeywell/types',
    '@honeywell/utils',
  ],
  experimental: {
    optimizePackageImports: ['@remixicon/react'],
  },
  async headers() {
    return [
      {
        source: '/downloads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
