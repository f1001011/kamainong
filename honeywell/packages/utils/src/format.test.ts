/**
 * @file 格式化工具单元测试
 * @description 测试货币、百分比、时间格式化功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  formatCurrency,
  formatAmount,
  formatSystemTime,
  formatPercent,
  formatPhone,
} from './format';

describe('格式化工具 (format)', () => {
  describe('formatCurrency', () => {
    it('应该正确格式化数字金额', () => {
      expect(formatCurrency(100)).toBe('$ 100.00');
      expect(formatCurrency(0)).toBe('$ 0.00');
      expect(formatCurrency(1234.5)).toBe('$ 1234.50');
      expect(formatCurrency(1234.567)).toBe('$ 1234.57');
    });

    it('应该正确格式化字符串金额', () => {
      expect(formatCurrency('100')).toBe('$ 100.00');
      expect(formatCurrency('1234.5')).toBe('$ 1234.50');
    });

    it('应该正确格式化 Decimal 金额', () => {
      const decimal = new Decimal('100.50');
      expect(formatCurrency(decimal)).toBe('$ 100.50');
    });

    it('应该支持自定义货币符号', () => {
      expect(formatCurrency(100, 'USD')).toBe('USD 100.00');
      expect(formatCurrency(100, '$')).toBe('$ 100.00');
    });

    it('应该支持无空格格式', () => {
      expect(formatCurrency(100, '$', false)).toBe('$100.00');
      expect(formatCurrency(100, 'COP', false)).toBe('COP100.00');
    });

    it('应该处理 NaN 和 Infinity', () => {
      expect(formatCurrency(NaN)).toBe('$ 0.00');
      expect(formatCurrency(Infinity)).toBe('$ 0.00');
      expect(formatCurrency(-Infinity)).toBe('$ 0.00');
    });

    it('应该处理负数', () => {
      expect(formatCurrency(-100)).toBe('$ -100.00');
    });
  });

  describe('formatAmount (别名)', () => {
    it('应该与 formatCurrency 功能相同', () => {
      expect(formatAmount(100)).toBe(formatCurrency(100));
      expect(formatAmount(100, 'USD')).toBe(formatCurrency(100, 'USD'));
    });
  });

  describe('formatSystemTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // 设置一个固定的 UTC 时间
      vi.setSystemTime(new Date('2026-02-05T15:30:45Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该格式化 datetime 格式', () => {
      const date = new Date('2026-02-05T15:30:45Z');
      const result = formatSystemTime(date, 'datetime', 'America/Bogota');
      // America/Bogota 是 UTC-5，所以应该是 10:30:45
      expect(result).toContain('10:30:45');
    });

    it('应该格式化 date 格式', () => {
      const date = new Date('2026-02-05T15:30:45Z');
      const result = formatSystemTime(date, 'date', 'America/Bogota');
      // 验证包含日期部分
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('应该格式化 time 格式', () => {
      const date = new Date('2026-02-05T15:30:45Z');
      const result = formatSystemTime(date, 'time', 'America/Bogota');
      expect(result).toContain('10:30:45');
    });

    it('应该支持自定义格式', () => {
      const date = new Date('2026-02-05T15:30:45Z');
      const result = formatSystemTime(date, 'yyyy-MM-dd HH:mm:ss', 'America/Bogota');
      expect(result).toBe('2026-02-05 10:30:45');
    });

    it('应该处理 ISO 字符串输入', () => {
      const result = formatSystemTime('2026-02-05T15:30:45Z', 'datetime', 'America/Bogota');
      expect(result).toBeTruthy();
    });

    it('应该处理无效日期', () => {
      const result = formatSystemTime('invalid-date', 'datetime');
      expect(result).toBe('');
    });

    it('应该支持不同时区', () => {
      const date = new Date('2026-02-05T15:30:45Z');
      
      // UTC-5 (Bogota)
      const bogotaTime = formatSystemTime(date, 'yyyy-MM-dd HH:mm:ss', 'America/Bogota');
      expect(bogotaTime).toBe('2026-02-05 10:30:45');
      
      // UTC+8 (Shanghai)
      const shanghaiTime = formatSystemTime(date, 'yyyy-MM-dd HH:mm:ss', 'Asia/Shanghai');
      expect(shanghaiTime).toBe('2026-02-05 23:30:45');
    });
  });

  describe('formatPercent', () => {
    it('应该正确格式化百分比', () => {
      expect(formatPercent(5)).toBe('5.00%');
      expect(formatPercent(5.5)).toBe('5.50%');
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('应该支持自定义小数位', () => {
      expect(formatPercent(5.555, 1)).toBe('5.6%');
      expect(formatPercent(5.555, 0)).toBe('6%');
    });

    it('应该处理字符串输入', () => {
      expect(formatPercent('5')).toBe('5.00%');
    });

    it('应该处理无效输入', () => {
      expect(formatPercent(NaN)).toBe('0.00%');
    });
  });

  describe('formatPhone', () => {
    it('应该格式化手机号', () => {
      expect(formatPhone('3123456789')).toBe('+57 3123456789');
    });

    it('应该移除已有的区号', () => {
      expect(formatPhone('+57 3123456789')).toBe('+57 3123456789');
      expect(formatPhone('+1 3123456789')).toBe('+57 3123456789');
    });

    it('应该支持自定义区号', () => {
      expect(formatPhone('3123456789', '+86')).toBe('+86 3123456789');
    });
  });
});
