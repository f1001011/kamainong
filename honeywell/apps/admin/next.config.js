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
    '@honeywell/types',
    '@honeywell/utils',
    '@ant-design/icons',
    '@ant-design/pro-components',
    'antd',
  ],
  // 修复 react-diff-viewer-continued 包在 webpack 编译时的问题
  webpack: (config, { isServer }) => {
    // 忽略 computeWorker.ts 的导入
    config.resolve.alias = {
      ...config.resolve.alias,
      './computeWorker.ts': false,
    };
    return config;
  },
};

module.exports = nextConfig;
