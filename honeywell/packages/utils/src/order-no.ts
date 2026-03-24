/**
 * @file 订单号生成工具
 * @description 生成和验证各类订单号
 * @depends 开发文档/02-数据层/02.2-API规范.md 第7.3节 - 订单号规则
 * @depends 开发文档.md 第2.9节 - 订单号生成规则
 * 
 * 订单号规则：
 * - 固定 20 位
 * - 格式：{业务类型2位}{日期8位}{随机数10位}
 * - 业务类型：RC=充值 / WD=提现 / PO=持仓订单
 * - 全局唯一，不可重复
 */

import { ORDER_NO, DEFAULT_CONFIG } from '@honeywell/config';

/**
 * 随机字符串字符集
 * 使用数字和大写字母，共36个字符
 */
const RANDOM_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * 订单类型简写（符合提示词要求）
 * - RC = 充值订单 (Recharge)
 * - WD = 提现订单 (Withdraw)
 * - PO = 持仓订单 (Position)
 */
export type OrderType = 'RC' | 'WD' | 'PO';

/**
 * 订单类型完整名称（用于内部映射）
 */
export type OrderTypeFull = keyof typeof ORDER_NO.PREFIX;

/**
 * 简写到完整名称的映射
 */
const ORDER_TYPE_MAP: Record<OrderType, OrderTypeFull> = {
  RC: 'RECHARGE',
  WD: 'WITHDRAW',
  PO: 'POSITION',
};

/**
 * 生成订单号
 * @description 依据：02.2-API规范.md 第7.3节 - 订单号规则
 * 格式：{业务类型2位}{日期8位YYYYMMDD}{随机字符10位} = 20位
 * @param type - 订单类型：RC=充值, WD=提现, PO=持仓
 * @returns 20位订单号
 * @example
 * generateOrderNo('RC');  // "RC20260205A1B2C3D4E5"
 * generateOrderNo('WD');  // "WD20260205F6G7H8I9J0"
 * generateOrderNo('PO');  // "PO20260205K1L2M3N4O5"
 */
export function generateOrderNo(type: OrderType): string {
  // 验证订单类型
  if (!ORDER_TYPE_MAP[type]) {
    throw new Error(`无效的订单类型: ${type}，有效值为 RC/WD/PO`);
  }

  const fullType = ORDER_TYPE_MAP[type];
  const prefix = ORDER_NO.PREFIX[fullType];
  
  // 生成日期部分：YYYYMMDD（使用系统时区，避免 UTC 跨日偏差）
  const localDate = new Date().toLocaleString('en-US', {
    timeZone: DEFAULT_CONFIG.SYSTEM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [month, day, year] = localDate.split('/');
  const date = `${year}${month}${day}`;
  
  // 生成随机部分：10位随机字符
  const random = generateRandomString(10);

  return `${prefix}${date}${random}`;
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @returns 随机字符串（数字+大写字母）
 */
function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += RANDOM_CHARSET.charAt(
      Math.floor(Math.random() * RANDOM_CHARSET.length)
    );
  }
  return result;
}

/**
 * 订单号解析结果
 */
export interface ParsedOrderNo {
  /** 订单类型前缀（RC/WD/PO） */
  type: string;
  /** 日期部分（YYYYMMDD） */
  date: string;
  /** 随机数部分 */
  random: string;
}

/**
 * 解析订单号
 * @param orderNo - 订单号字符串
 * @returns 解析后的订单号各部分，无效则返回 null
 * @example
 * parseOrderNo('RC20260205A1B2C3D4E5');
 * // { type: 'RC', date: '20260205', random: 'A1B2C3D4E5' }
 */
export function parseOrderNo(orderNo: string): ParsedOrderNo | null {
  if (!orderNo || orderNo.length !== ORDER_NO.LENGTH) {
    return null;
  }

  return {
    type: orderNo.slice(0, 2),
    date: orderNo.slice(2, 10),
    random: orderNo.slice(10),
  };
}

/**
 * 验证订单号格式
 * @param orderNo - 待验证的订单号
 * @returns 是否为有效格式的订单号
 * @example
 * isValidOrderNo('RC20260205A1B2C3D4E5'); // true
 * isValidOrderNo('XX20260205A1B2C3D4E5'); // false（无效前缀）
 * isValidOrderNo('RC202602051234567890');  // true
 * isValidOrderNo('RC123');                 // false（长度不对）
 */
export function isValidOrderNo(orderNo: string): boolean {
  // 检查长度
  if (!orderNo || orderNo.length !== ORDER_NO.LENGTH) {
    return false;
  }

  // 检查前缀
  const prefix = orderNo.slice(0, 2);
  const validPrefixes = Object.values(ORDER_NO.PREFIX) as string[];
  if (!validPrefixes.includes(prefix)) {
    return false;
  }

  // 验证日期部分：8位数字
  const datePart = orderNo.slice(2, 10);
  if (!/^\d{8}$/.test(datePart)) {
    return false;
  }

  // 验证日期是否合法
  const year = parseInt(datePart.slice(0, 4), 10);
  const month = parseInt(datePart.slice(4, 6), 10);
  const day = parseInt(datePart.slice(6, 8), 10);
  
  // 简单校验年月日范围
  if (year < 2020 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // 验证随机数部分：10位数字或大写字母
  const randomPart = orderNo.slice(10);
  if (!/^[0-9A-Z]{10}$/.test(randomPart)) {
    return false;
  }

  return true;
}

/**
 * 根据订单号获取订单类型名称
 * @param orderNo - 订单号
 * @returns 订单类型名称（充值/提现/持仓），无效则返回 null
 */
export function getOrderTypeName(orderNo: string): string | null {
  if (!isValidOrderNo(orderNo)) {
    return null;
  }

  const prefix = orderNo.slice(0, 2);
  const typeNames: Record<string, string> = {
    [ORDER_NO.PREFIX.RECHARGE]: '充值订单',
    [ORDER_NO.PREFIX.WITHDRAW]: '提现订单',
    [ORDER_NO.PREFIX.POSITION]: '持仓订单',
  };

  return typeNames[prefix] || null;
}

/**
 * 根据订单号获取创建日期
 * @param orderNo - 订单号
 * @returns Date 对象，无效则返回 null
 */
export function getOrderDate(orderNo: string): Date | null {
  const parsed = parseOrderNo(orderNo);
  if (!parsed) {
    return null;
  }

  const { date } = parsed;
  const year = parseInt(date.slice(0, 4), 10);
  const month = parseInt(date.slice(4, 6), 10) - 1; // 月份从0开始
  const day = parseInt(date.slice(6, 8), 10);

  const orderDate = new Date(year, month, day);
  
  // 检查日期是否有效
  if (isNaN(orderDate.getTime())) {
    return null;
  }

  return orderDate;
}
