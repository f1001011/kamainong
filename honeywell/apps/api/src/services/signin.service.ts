/**
 * @file 签到服务
 * @description 处理签到状态查询、执行签到、签到记录查询等核心业务逻辑
 * @depends 开发文档/开发文档.md 第9节 - 营销活动系统
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10节 - 签到接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.6节 - SignInRecord表
 */

import { prisma } from '@/lib/prisma';
import { withLock, CACHE_KEYS, LOCK_TTL, deleteCache } from '@/lib/redis';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { getSystemTimezone } from '@/lib/config';

/**
 * Prisma 事务客户端类型
 * @description 用于交互式事务中的 tx 参数类型定义
 */
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * 普通签到状态
 */
export interface NormalSignInStatus {
  /** 是否可签到 */
  available: boolean;
  /** 今日是否已签到 */
  todaySigned: boolean;
  /** 签到奖励金额 */
  reward: string;
  /** 是否已完成（简化版无此概念，始终false） */
  completed: boolean;
  /** 窗口是否过期（简化版无窗口期，始终false） */
  windowExpired: boolean;
  /** 当前连续签到天数 */
  currentStreak: number;
  /** 目标天数（简化版为0） */
  targetDays: number;
  /** 窗口剩余天数（简化版为0） */
  remainingWindowDays: number;
}

/**
 * SVIP签到状态
 */
export interface SvipSignInStatus {
  /** 是否可签到 */
  available: boolean;
  /** 今日是否已签到 */
  todaySigned: boolean;
  /** 签到奖励金额 */
  reward: string;
  /** SVIP等级 */
  svipLevel: number;
}

/**
 * 签到状态返回结果
 */
export interface SignInStatusResult {
  normalSignIn: NormalSignInStatus;
  svipSignIn: SvipSignInStatus | null;
}

/**
 * SVIP签到活动配置
 * @description 与数据库 Activity.config JSON 字段对应
 */
interface SvipSignInConfig {
  rewards?: Record<string, number>;
}

/**
 * 签到奖励记录
 */
export interface SignInReward {
  type: 'NORMAL' | 'SVIP';
  amount: string;
}

/**
 * 执行签到返回结果
 */
export interface ExecuteSignInResult {
  rewards: SignInReward[];
  totalAmount: string;
  newStreak: number;
  signInCompleted: boolean;
}

/**
 * 签到记录
 */
export interface SignInRecordItem {
  date: string;
  signed: boolean;
  signType: 'NORMAL' | 'SVIP' | null;
  amount: string | null;
  signedAt: string | null;
}

/**
 * 签到服务类
 */
export class SignInService {
  /**
   * 获取签到状态
   * @description 依据：02.3-前端API接口清单.md 第10.1节
   * @param userId 用户ID
   * @returns 签到状态
   */
  async getSignInStatus(userId: number): Promise<SignInStatusResult> {
    // 1. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastSignInDate: true,
        svipLevel: true,
      },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    // 2. 获取签到奖励配置（从 GlobalConfig 获取）
    const [signinConfig, svipActivity] = await Promise.all([
      prisma.globalConfig.findUnique({ where: { key: 'signin_daily_reward' } }),
      this.getActivityConfig('SVIP_SIGNIN'),
    ]);
    const dailyReward = signinConfig?.value
      ? String(parseFloat(String(signinConfig.value)))
      : '100';

    // 3. 计算今日日期（系统时区，从数据库配置获取）
    const today = await this.getSystemDateStart();
    const todayStr = this.formatDateToString(today);

    // 4. 判断今日普通签到是否已完成
    const lastSignInDateStr = user.lastSignInDate
      ? this.formatDateToString(new Date(user.lastSignInDate))
      : null;
    const normalTodaySigned = lastSignInDateStr === todayStr;

    // 5. 构建普通签到状态（简化版：所有用户长期每日签到，无窗口期）
    const normalSignIn: NormalSignInStatus = {
      available: !normalTodaySigned,
      todaySigned: normalTodaySigned,
      reward: dailyReward,
      completed: false,
      windowExpired: false,
      currentStreak: 0,
      targetDays: 0,
      remainingWindowDays: 0,
    };

    // 6. 判断今日SVIP签到是否已完成
    let svipTodaySigned = false;
    if (user.svipLevel > 0) {
      const svipRecord = await prisma.signInRecord.findUnique({
        where: {
          userId_signType_signDate: {
            userId,
            signType: 'SVIP',
            signDate: today,
          },
        },
      });
      svipTodaySigned = !!svipRecord;
    }

    // 7. 构建SVIP签到状态（仅SVIP用户返回）
    let svipSignIn: SvipSignInStatus | null = null;
    if (user.svipLevel > 0 && svipActivity?.isActive) {
      const svipConfig = svipActivity?.config as SvipSignInConfig | null;
      const svipRewardKey = `SVIP${user.svipLevel}`;
      const svipReward = svipConfig?.rewards?.[svipRewardKey] ?? 0;

      svipSignIn = {
        available: !svipTodaySigned,
        todaySigned: svipTodaySigned,
        reward: String(svipReward),
        svipLevel: user.svipLevel,
      };
    }

    return {
      normalSignIn,
      svipSignIn,
    };
  }

  /**
   * 执行签到
   * @description 依据：02.3-前端API接口清单.md 第10.2节
   * @param userId 用户ID
   * @returns 签到结果
   */
  async executeSignIn(userId: number): Promise<ExecuteSignInResult> {
    const lockKey = CACHE_KEYS.LOCK.SIGNIN(userId);

    return withLock(lockKey, LOCK_TTL.SIGNIN, async () => {
      // 1. 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          svipLevel: true,
          availableBalance: true,
          lastSignInDate: true,
        },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      // 2. 获取签到奖励配置（从 GlobalConfig 获取）
      const [signinConfig, svipActivity] = await Promise.all([
        prisma.globalConfig.findUnique({ where: { key: 'signin_daily_reward' } }),
        this.getActivityConfig('SVIP_SIGNIN'),
      ]);

      // 3. 计算今日日期（系统时区，从数据库配置获取）
      const today = await this.getSystemDateStart();

      // 4. 检查今日是否已签到
      const existingNormalSignIn = await prisma.signInRecord.findFirst({
        where: {
          userId,
          signType: 'NORMAL',
          signDate: today,
        },
      });

      if (existingNormalSignIn) {
        throw Errors.alreadySignedToday();
      }

      // 5. 发放每日签到奖励（所有用户统一金额，从 GlobalConfig 获取）
      const dailyRewardValue = signinConfig?.value
        ? parseFloat(String(signinConfig.value))
        : 100;
      const normalReward = new Decimal(dailyRewardValue);
      const rewards: SignInReward[] = [];
      let totalAmount = new Decimal(0);

      rewards.push({ type: 'NORMAL', amount: normalReward.toString() });
      totalAmount = totalAmount.add(normalReward);

      await prisma.$transaction(async (tx: TransactionClient) => {
        await tx.signInRecord.create({
          data: {
            userId,
            signType: 'NORMAL',
            signDate: today,
            amount: normalReward,
          },
        });

        const newBalance = user.availableBalance.add(normalReward);
        await tx.user.update({
          where: { id: userId },
          data: {
            lastSignInDate: today,
            availableBalance: newBalance,
          },
        });

        await tx.transaction.create({
          data: {
            userId,
            type: 'SIGN_IN',
            amount: normalReward,
            balanceAfter: newBalance,
            remark: 'Bono de check-in',
          },
        });
      });

      // 6. SVIP签到逻辑（SVIP用户额外奖励，与普通签到叠加）
      if (user.svipLevel > 0 && svipActivity?.isActive) {
        const svipRecord = await prisma.signInRecord.findUnique({
          where: {
            userId_signType_signDate: {
              userId,
              signType: 'SVIP',
              signDate: today,
            },
          },
        });

        if (!svipRecord) {
          const svipConfigInner = svipActivity?.config as SvipSignInConfig | null;
          const svipRewardKey = `SVIP${user.svipLevel}`;
          const svipRewardAmount = new Decimal(svipConfigInner?.rewards?.[svipRewardKey] ?? 0);

          if (svipRewardAmount.gt(0)) {
            rewards.push({ type: 'SVIP', amount: svipRewardAmount.toString() });
            totalAmount = totalAmount.add(svipRewardAmount);

            await prisma.$transaction(async (tx: TransactionClient) => {
              await tx.signInRecord.create({
                data: {
                  userId,
                  signType: 'SVIP',
                  signDate: today,
                  amount: svipRewardAmount,
                },
              });

              const currentUser = await tx.user.findUnique({
                where: { id: userId },
                select: { availableBalance: true },
              });

              const newBalance = currentUser!.availableBalance.add(svipRewardAmount);

              await tx.user.update({
                where: { id: userId },
                data: {
                  availableBalance: newBalance,
                },
              });

              await tx.transaction.create({
                data: {
                  userId,
                  type: 'SIGN_IN',
                  amount: svipRewardAmount,
                  balanceAfter: newBalance,
                  remark: `SVIP${user.svipLevel}签到奖励`,
                },
              });
            });
          }
        }
      }

      // 7. 清除用户缓存
      await deleteCache(CACHE_KEYS.USER.INFO(userId));

      return {
        rewards,
        totalAmount: totalAmount.toString(),
        newStreak: 0,
        signInCompleted: false,
      };
    });
  }

  /**
   * 获取签到记录
   * @description 依据：02.3-前端API接口清单.md 第10.3节
   * @param userId 用户ID
   * @param days 查询天数（默认7天）
   * @returns 签到记录列表
   */
  async getSignInRecords(userId: number, days: number = 7): Promise<{
    records: SignInRecordItem[];
    svipRecords: SignInRecordItem[];
  }> {
    // 1. 计算日期范围（时区从数据库配置获取）
    const today = await this.getSystemDateStart();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);

    // 2. 查询签到记录
    const signInRecords = await prisma.signInRecord.findMany({
      where: {
        userId,
        signDate: {
          gte: startDate,
          lte: today,
        },
      },
      orderBy: { signDate: 'desc' },
    });

    // 3. 按类型分组
    const normalRecordsMap = new Map<string, typeof signInRecords[0]>();
    const svipRecordsMap = new Map<string, typeof signInRecords[0]>();

    for (const record of signInRecords) {
      const dateStr = this.formatDateToString(new Date(record.signDate));
      if (record.signType === 'NORMAL') {
        normalRecordsMap.set(dateStr, record);
      } else if (record.signType === 'SVIP') {
        svipRecordsMap.set(dateStr, record);
      }
    }

    // 4. 构建返回数据（包含所有日期）
    const records: SignInRecordItem[] = [];
    const svipRecords: SignInRecordItem[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDateToString(date);

      // 普通签到记录
      const normalRecord = normalRecordsMap.get(dateStr);
      records.push({
        date: dateStr,
        signed: !!normalRecord,
        signType: normalRecord ? 'NORMAL' : null,
        amount: normalRecord ? normalRecord.amount.toString() : null,
        signedAt: normalRecord ? normalRecord.createdAt.toISOString() : null,
      });

      // SVIP签到记录
      const svipRecord = svipRecordsMap.get(dateStr);
      svipRecords.push({
        date: dateStr,
        signed: !!svipRecord,
        signType: svipRecord ? 'SVIP' : null,
        amount: svipRecord ? svipRecord.amount.toString() : null,
        signedAt: svipRecord ? svipRecord.createdAt.toISOString() : null,
      });
    }

    return { records, svipRecords };
  }

  /**
   * 获取活动配置
   * @param activityCode 活动代码
   */
  private async getActivityConfig(activityCode: string) {
    const activity = await prisma.activity.findUnique({
      where: { code: activityCode },
    });

    if (!activity) {
      return null;
    }

    return {
      ...activity,
      // 安全解析 config JSON
      config: activity.config as Record<string, unknown> | null,
    };
  }

  /**
   * 获取系统时区的当日开始时间
   * @description 依据：开发文档.md 第3节 - 时区处理，时区从数据库配置获取
   * @returns 当日 00:00:00 的 Date 对象（基于系统时区）
   */
  private async getSystemDateStart(): Promise<Date> {
    // 从数据库配置获取系统时区，禁止硬编码
    const systemTimezone = await getSystemTimezone();
    
    const now = new Date();
    // 使用 Intl.DateTimeFormat 获取指定时区的日期部分
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: systemTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now); // 格式: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // 返回 UTC 时间的日期起始点（存入数据库时使用）
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * 格式化日期为字符串 (YYYY-MM-DD)
   * @param date 日期对象
   * @returns 格式化后的日期字符串
   */
  private formatDateToString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// 单例导出
export const signInService = new SignInService();
