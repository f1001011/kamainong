/**
 * @file 订单号生成工具
 * @description 生成唯一订单号，格式：{类型2位}{日期8位}{随机10位} = 20位
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第6节 - 订单号生成规范
 */

import { customAlphabet } from 'nanoid';

// 字符集（排除易混淆字符 0OIL1）
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(ALPHABET, 10);

/**
 * 订单类型前缀
 */
export const ORDER_TYPE = {
  /** 充值订单 */
  RECHARGE: 'RC',
  /** 提现订单 */
  WITHDRAW: 'WD',
  /** 持仓订单 */
  POSITION: 'PO',
} as const;

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];

/**
 * 生成订单号
 * @description 格式：{类型2位}{日期8位}{随机10位} = 20位
 * @param type 订单类型：RC=充值 / WD=提现 / PO=持仓
 * @returns 20位订单号
 *
 * @example
 * generateOrderNo('RC') // 'RC20260203A1B2C3D4E5'
 */
export function generateOrderNo(type: OrderType): string {
  const date = new Date();
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  const random = nanoid();

  return `${type}${dateStr}${random}`;
}

/**
 * 解析订单号
 * @param orderNo 订单号
 * @returns 解析结果或 null
 */
export function parseOrderNo(orderNo: string): {
  type: string;
  date: string;
  random: string;
} | null {
  if (!orderNo || orderNo.length !== 20) {
    return null;
  }

  return {
    type: orderNo.substring(0, 2),
    date: orderNo.substring(2, 10),
    random: orderNo.substring(10),
  };
}
