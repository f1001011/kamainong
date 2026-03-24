/**
 * @file 签到类型定义
 * @description 签到功能相关的 TypeScript 类型
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10节
 */

// ========================================
// 普通签到状态类型
// ========================================

/**
 * 普通签到状态
 * @description 依据：02.3-前端API接口清单 第10.1节
 */
export interface NormalSignInStatus {
  /** 是否可用（未购买产品的用户可用） */
  available: boolean;
  /** 是否已完成3天签到任务 */
  completed: boolean;
  /** 7天窗口期是否已过期 */
  windowExpired: boolean;
  /** 当前连续签到天数（0-3） */
  currentStreak: number;
  /** 目标天数（3天） */
  targetDays: number;
  /** 窗口期剩余天数 */
  remainingWindowDays: number;
  /** 今天是否已签到 */
  todaySigned: boolean;
  /** 每日奖励金额（Decimal字符串，如 "1.00"） */
  reward: string;
}

/**
 * SVIP签到状态
 * @description 依据：02.3-前端API接口清单 第10.1节
 */
export interface SvipSignInStatus {
  /** 是否可用 */
  available: boolean;
  /** 今天是否已签到 */
  todaySigned: boolean;
  /** SVIP签到奖励金额 */
  reward: string;
  /** 当前SVIP等级（1-8） */
  svipLevel: number;
}

/**
 * 签到状态响应
 * @description 依据：02.3-前端API接口清单 第10.1节
 */
export interface SignInStatusResponse {
  /** 普通签到状态（7天窗口期） */
  normalSignIn: NormalSignInStatus;
  /** SVIP签到状态（仅SVIP用户有此字段） */
  svipSignIn?: SvipSignInStatus;
}

// ========================================
// 签到操作响应类型
// ========================================

/**
 * 签到奖励项
 */
export interface SignInRewardItem {
  /** 奖励类型 */
  type: 'NORMAL' | 'SVIP';
  /** 奖励金额（Decimal字符串） */
  amount: string;
}

/**
 * 签到操作响应
 * @description 依据：02.3-前端API接口清单 第10.2节
 */
export interface SignInResult {
  /** 奖励列表（可能包含普通奖励和SVIP奖励） */
  rewards: SignInRewardItem[];
  /** 总奖励金额 */
  totalAmount: string;
  /** 新的连续天数 */
  newStreak: number;
  /** 普通用户3天签到是否完成 */
  signInCompleted: boolean;
}

// ========================================
// 签到记录类型
// ========================================

/**
 * 签到记录项
 */
export interface SignInRecord {
  /** 日期（格式：YYYY-MM-DD） */
  date: string;
  /** 是否已签到 */
  signed: boolean;
  /** 签到类型 */
  signType: 'NORMAL' | null;
  /** 奖励金额 */
  amount: string | null;
  /** 签到时间（ISO8601格式） */
  signedAt: string | null;
}

/**
 * SVIP签到记录项
 */
export interface SvipSignInRecord {
  /** 日期（格式：YYYY-MM-DD） */
  date: string;
  /** 是否已签到 */
  signed: boolean;
  /** 奖励金额 */
  amount: string | null;
  /** 签到时间（ISO8601格式） */
  signedAt: string | null;
}

/**
 * 签到记录响应
 * @description 依据：02.3-前端API接口清单 第10.3节
 */
export interface SignInRecordsResponse {
  /** 普通签到记录（近7天） */
  records: SignInRecord[];
  /** SVIP签到记录（仅SVIP用户有） */
  svipRecords?: SvipSignInRecord[];
}

// ========================================
// 用户签到类型（前端判断用）
// ========================================

/**
 * 用户签到类型枚举
 */
export type UserSignInType = 'NORMAL' | 'VIP' | 'SVIP';

/**
 * 判断用户签到类型
 * @param status - 签到状态响应
 * @returns 用户签到类型
 * 
 * @description
 * - SVIP用户：有svipSignIn且available为true
 * - 普通用户：normalSignIn.available为true（未购买产品）
 * - VIP用户：已购买产品但非SVIP
 */
export function getUserSignInType(status: SignInStatusResponse): UserSignInType {
  // SVIP用户：有svipSignIn且available
  if (status.svipSignIn?.available) {
    return 'SVIP';
  }
  // 普通用户：normalSignIn.available为true（未购买产品）
  if (status.normalSignIn.available) {
    return 'NORMAL';
  }
  // VIP用户：已购买产品但非SVIP
  return 'VIP';
}

/**
 * 判断今日是否可以签到
 * @param status - 签到状态响应
 * @returns 是否可以签到
 */
export function canSignInToday(status: SignInStatusResponse): boolean {
  const userType = getUserSignInType(status);
  const { normalSignIn, svipSignIn } = status;
  
  // 普通用户：未完成且未过期且今日未签到
  if (userType === 'NORMAL') {
    return !normalSignIn.completed && 
           !normalSignIn.windowExpired && 
           !normalSignIn.todaySigned;
  }
  
  // VIP/SVIP用户：今日未签到
  return !normalSignIn.todaySigned && !svipSignIn?.todaySigned;
}
