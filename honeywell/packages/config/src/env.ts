import { z } from 'zod';

/**
 * API 服务环境变量 Schema
 */
export const apiEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AES_SECRET_KEY: z.string().length(32),
  JWT_SECRET: z.string().min(16),
  CALLBACK_DOMAIN: z.string().url(),
  UPLOAD_DIR: z.string().optional().default('/uploads'),
  MAX_FILE_SIZE: z.coerce.number().optional().default(10485760),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Web 前端环境变量 Schema
 */
export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  AES_SECRET_KEY: z.string().length(32),
});

/**
 * Admin 后台环境变量 Schema
 */
export const adminEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ADMIN_URL: z.string().url(),
  ADMIN_JWT_SECRET: z.string().min(16),
});

/**
 * 验证 API 环境变量
 */
export function validateApiEnv() {
  const result = apiEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid API environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid API environment variables');
  }

  return result.data;
}

/**
 * 验证 Web 环境变量
 */
export function validateWebEnv() {
  const result = webEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid Web environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid Web environment variables');
  }

  return result.data;
}

/**
 * 验证 Admin 环境变量
 */
export function validateAdminEnv() {
  const result = adminEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid Admin environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid Admin environment variables');
  }

  return result.data;
}

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;
