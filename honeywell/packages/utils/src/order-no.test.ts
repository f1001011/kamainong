/**
 * @file 订单号工具单元测试
 * @description 测试订单号生成、解析、验证功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOrderNo,
  parseOrderNo,
  isValidOrderNo,
  getOrderTypeName,
  getOrderDate,
} from './order-no';

describe('订单号工具 (order-no)', () => {
  describe('generateOrderNo', () => {
    beforeEach(() => {
      // 模拟固定日期以便测试
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T10:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该生成 20 位订单号', () => {
      const orderNo = generateOrderNo('RC');
      expect(orderNo.length).toBe(20);
    });

    it('充值订单应以 RC 开头', () => {
      const orderNo = generateOrderNo('RC');
      expect(orderNo.startsWith('RC')).toBe(true);
    });

    it('提现订单应以 WD 开头', () => {
      const orderNo = generateOrderNo('WD');
      expect(orderNo.startsWith('WD')).toBe(true);
    });

    it('持仓订单应以 PO 开头', () => {
      const orderNo = generateOrderNo('PO');
      expect(orderNo.startsWith('PO')).toBe(true);
    });

    it('订单号应包含正确的日期', () => {
      const orderNo = generateOrderNo('RC');
      // 日期部分是 [2:10]
      const datePart = orderNo.slice(2, 10);
      expect(datePart).toBe('20260205');
    });

    it('生成的订单号应该是唯一的（大概率）', () => {
      const orderNos = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        orderNos.add(generateOrderNo('RC'));
      }
      // 1000 个订单号应该几乎没有重复
      expect(orderNos.size).toBeGreaterThan(990);
    });

    it('随机部分应只包含数字和大写字母', () => {
      for (let i = 0; i < 100; i++) {
        const orderNo = generateOrderNo('RC');
        const randomPart = orderNo.slice(10);
        expect(randomPart).toMatch(/^[0-9A-Z]{10}$/);
      }
    });

    it('无效订单类型应抛出错误', () => {
      // @ts-expect-error 测试无效输入
      expect(() => generateOrderNo('XX')).toThrow('无效的订单类型');
    });
  });

  describe('parseOrderNo', () => {
    it('应该正确解析订单号', () => {
      const result = parseOrderNo('RC20260205A1B2C3D4E5');
      expect(result).toEqual({
        type: 'RC',
        date: '20260205',
        random: 'A1B2C3D4E5',
      });
    });

    it('应该正确解析不同类型的订单号', () => {
      expect(parseOrderNo('WD20260205F6G7H8I9J0')?.type).toBe('WD');
      expect(parseOrderNo('PO20260205K1L2M3N4O5')?.type).toBe('PO');
    });

    it('长度不正确应返回 null', () => {
      expect(parseOrderNo('RC123')).toBe(null);
      expect(parseOrderNo('')).toBe(null);
      expect(parseOrderNo('RC20260205A1B2C3D4E5X')).toBe(null);
    });
  });

  describe('isValidOrderNo', () => {
    it('有效订单号应返回 true', () => {
      expect(isValidOrderNo('RC20260205A1B2C3D4E5')).toBe(true);
      expect(isValidOrderNo('WD20260205F6G7H8I9J0')).toBe(true);
      expect(isValidOrderNo('PO20260205K1L2M3N4O5')).toBe(true);
    });

    it('无效前缀应返回 false', () => {
      expect(isValidOrderNo('XX20260205A1B2C3D4E5')).toBe(false);
      expect(isValidOrderNo('AB20260205A1B2C3D4E5')).toBe(false);
    });

    it('长度不正确应返回 false', () => {
      expect(isValidOrderNo('RC123')).toBe(false);
      expect(isValidOrderNo('RC20260205A1B2C3D4E5X')).toBe(false);
      expect(isValidOrderNo('')).toBe(false);
    });

    it('日期格式不正确应返回 false', () => {
      expect(isValidOrderNo('RCABCDEFGHA1B2C3D4E5')).toBe(false); // 日期不是数字
    });

    it('随机部分格式不正确应返回 false', () => {
      expect(isValidOrderNo('RC20260205a1b2c3d4e5')).toBe(false); // 小写字母
      expect(isValidOrderNo('RC20260205!@#$%^&*()')).toBe(false); // 特殊字符
    });

    it('日期范围不合理应返回 false', () => {
      expect(isValidOrderNo('RC20190105A1B2C3D4E5')).toBe(false); // 年份过早
      expect(isValidOrderNo('RC20260005A1B2C3D4E5')).toBe(false); // 月份为0
      expect(isValidOrderNo('RC20261305A1B2C3D4E5')).toBe(false); // 月份超过12
      expect(isValidOrderNo('RC20260100A1B2C3D4E5')).toBe(false); // 日期为0
      expect(isValidOrderNo('RC20260132A1B2C3D4E5')).toBe(false); // 日期超过31
    });
  });

  describe('getOrderTypeName', () => {
    it('应该返回正确的订单类型名称', () => {
      expect(getOrderTypeName('RC20260205A1B2C3D4E5')).toBe('充值订单');
      expect(getOrderTypeName('WD20260205F6G7H8I9J0')).toBe('提现订单');
      expect(getOrderTypeName('PO20260205K1L2M3N4O5')).toBe('持仓订单');
    });

    it('无效订单号应返回 null', () => {
      expect(getOrderTypeName('XX20260205A1B2C3D4E5')).toBe(null);
      expect(getOrderTypeName('invalid')).toBe(null);
    });
  });

  describe('getOrderDate', () => {
    it('应该返回正确的日期', () => {
      const date = getOrderDate('RC20260205A1B2C3D4E5');
      expect(date).not.toBe(null);
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(1); // 月份从0开始
      expect(date?.getDate()).toBe(5);
    });

    it('无效订单号应返回 null', () => {
      expect(getOrderDate('invalid')).toBe(null);
      expect(getOrderDate('')).toBe(null);
    });
  });
});
