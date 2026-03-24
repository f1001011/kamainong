/**
 * PM2 生产环境部署配置
 * 域名映射:
 * - web (3000): lles-ma.com / www.lles-ma.com
 * - admin (3001): jiuge.lles-ma.com
 * - api (3002): ipa.lles-ma.com
 */
module.exports = {
  apps: [
    {
      name: 'hype-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../logs/web-error.log',
      out_file: '../logs/web-out.log',
      max_memory_restart: '1G',
    },
    {
      name: 'hype-admin',
      cwd: './apps/admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      max_memory_restart: '1G',
    },
    {
      name: 'hype-api',
      cwd: './apps/api',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      max_memory_restart: '1G',
    },
  ],
};
