/**
 * @file 免审核配置服务
 * @description 后台管理端 - 提现免审核配置管理服务
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第10节 - 免审核配置接口
 * @depends 开发文档/开发文档.md 第13.9.4节 - 免审核提现配置
 */

import { prisma } from '@/lib/prisma';

/**
 * 免审核配置数据结构
 */
interface AutoApproveConfig {
  enabled: boolean;
  threshold: string;
  dailyLimit: number;
  timeRange: string;
  newUserDays: number;
}

/**
 * GlobalConfig 配置键定义
 */
const CONFIG_KEYS = {
  ENABLED: 'auto_approve_enabled',
  THRESHOLD: 'auto_approve_threshold',
  DAILY_LIMIT: 'auto_approve_daily_limit',
  TIME_RANGE: 'auto_approve_time_range',
  NEW_USER_DAYS: 'auto_approve_new_user_days',
} as const;

/**
 * 默认配置值
 * @description 依据：开发文档.md 第13.9.4节 - 免审核提现配置
 */
const DEFAULT_CONFIG: AutoApproveConfig = {
  enabled: false,
  threshold: '100.00',
  dailyLimit: 1,
  timeRange: '00:00-23:59',
  newUserDays: 0,
};

/**
 * 免审核配置服务类
 */
class AutoApproveService {
  /**
   * 获取免审核配置
   * @description 依据：02.4-后台API接口清单.md 第10.1节 - 获取免审核配置
   * @returns 免审核配置
   */
  async getConfig(): Promise<AutoApproveConfig> {
    // 批量获取所有配置项
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          in: Object.values(CONFIG_KEYS),
        },
      },
    });

    // 将配置转换为 Map 便于查找
    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    // 返回配置（使用默认值作为后备）
    return {
      enabled: this.parseBoolean(configMap.get(CONFIG_KEYS.ENABLED), DEFAULT_CONFIG.enabled),
      threshold: this.parseString(configMap.get(CONFIG_KEYS.THRESHOLD), DEFAULT_CONFIG.threshold),
      dailyLimit: this.parseNumber(configMap.get(CONFIG_KEYS.DAILY_LIMIT), DEFAULT_CONFIG.dailyLimit),
      timeRange: this.parseString(configMap.get(CONFIG_KEYS.TIME_RANGE), DEFAULT_CONFIG.timeRange),
      newUserDays: this.parseNumber(configMap.get(CONFIG_KEYS.NEW_USER_DAYS), DEFAULT_CONFIG.newUserDays),
    };
  }

  /**
   * 更新免审核配置
   * @description 依据：02.4-后台API接口清单.md 第10.1节 - 更新免审核配置
   * @param config 新配置
   * @returns 更新后的配置
   */
  async updateConfig(config: Partial<AutoApproveConfig>): Promise<AutoApproveConfig> {
    // 使用事务批量更新配置
    await prisma.$transaction(async (tx) => {
      // 更新 enabled
      if (config.enabled !== undefined) {
        await this.upsertConfig(tx, CONFIG_KEYS.ENABLED, config.enabled, '免审核开关');
      }

      // 更新 threshold
      if (config.threshold !== undefined) {
        await this.upsertConfig(tx, CONFIG_KEYS.THRESHOLD, config.threshold, '免审核金额阈值');
      }

      // 更新 dailyLimit
      if (config.dailyLimit !== undefined) {
        await this.upsertConfig(tx, CONFIG_KEYS.DAILY_LIMIT, config.dailyLimit, '每用户每日最多免审核次数');
      }

      // 更新 timeRange
      if (config.timeRange !== undefined) {
        await this.upsertConfig(tx, CONFIG_KEYS.TIME_RANGE, config.timeRange, '免审核时间窗口');
      }

      // 更新 newUserDays
      if (config.newUserDays !== undefined) {
        await this.upsertConfig(tx, CONFIG_KEYS.NEW_USER_DAYS, config.newUserDays, '新用户冷却期（天）');
      }
    });

    // 返回更新后的配置
    return this.getConfig();
  }

  /**
   * 插入或更新配置项
   */
  private async upsertConfig(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    key: string,
    value: boolean | string | number,
    description: string
  ): Promise<void> {
    await tx.globalConfig.upsert({
      where: { key },
      create: {
        key,
        value: value as unknown as Parameters<typeof tx.globalConfig.create>[0]['data']['value'],
        description,
      },
      update: {
        value: value as unknown as Parameters<typeof tx.globalConfig.update>[0]['data']['value'],
      },
    });
  }

  /**
   * 解析布尔值
   */
  private parseBoolean(value: unknown, defaultValue: boolean): boolean {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return !!value;
  }

  /**
   * 解析字符串
   */
  private parseString(value: unknown, defaultValue: string): string {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return String(value);
  }

  /**
   * 解析数字
   */
  private parseNumber(value: unknown, defaultValue: number): number {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }
}

// 单例导出
export const autoApproveService = new AutoApproveService();
