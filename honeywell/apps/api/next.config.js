const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@honeywell/config',
    '@honeywell/database',
    '@honeywell/payment',
    '@honeywell/types',
    '@honeywell/utils',
  ],
  serverExternalPackages: ['@prisma/client'],
  // 修复 monorepo 中 Prisma 客户端模块解析问题
  webpack: (config) => {
    const databasePath = path.resolve(__dirname, '../../packages/database');
    config.resolve.alias = {
      ...config.resolve.alias,
      '../generated/prisma': path.resolve(databasePath, 'generated/prisma'),
    };
    return config;
  },
};

module.exports = nextConfig;
