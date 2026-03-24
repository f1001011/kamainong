/**
 * @file 时区工具单元测试
 * @description 测试时区转换、时间计算功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSystemTimezone,
  getSystemTimezoneSync,
  setSystemTimezoneCache,
  clearSystemTimezoneCache,
  registerTimezoneConfigGetter,
  convertToTimezone,
  getNow,
  getTodayStart,
  getTodayEnd,
  isInTimeRange,
  isSameDay,
  isToday,
  isYesterday,
  daysBetween,
  addHours,
  addDays,
  addMinutes,
  getSystemDateBounds,
} from './timezone';

describe('时区工具 (timezone)', () => {
  beforeEach(() => {
    // 每个测试前清除缓存
    clearSystemTimezoneCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getSystemTimezone', () => {
    it('无缓存时应返回默认时区', async () => {
      const timezone = await getSystemTimezone();
      expect(timezone).toBe('America/Bogota');
    });

    it('有缓存时应返回缓存的时区', async () => {
      setSystemTimezoneCache('Asia/Shanghai');
      const timezone = await getSystemTimezone();
      expect(timezone).toBe('Asia/Shanghai');
    });

    it('注册配置获取器后应从数据库获取', async () => {
      const mockGetter = vi.fn().mockResolvedValue('Europe/London');
      registerTimezoneConfigGetter(mockGetter);
      
      const timezone = await getSystemTimezone();
      expect(timezone).toBe('Europe/London');
      expect(mockGetter).toHaveBeenCalled();
    });
  });

  describe('getSystemTimezoneSync', () => {
    it('无缓存时应返回默认时区', () => {
      expect(getSystemTimezoneSync()).toBe('America/Bogota');
    });

    it('有缓存时应返回缓存的时区', () => {
      setSystemTimezoneCache('Asia/Tokyo');
      expect(getSystemTimezoneSync()).toBe('Asia/Tokyo');
    });
  });

  describe('convertToTimezone', () => {
    it('应该正确转换 UTC 到哥伦比亚时间', () => {
      const utcDate = new Date('2026-02-05T15:30:00Z');
      const bogotaDate = convertToTimezone(utcDate, 'America/Bogota');
      
      // UTC-5
      expect(bogotaDate.getHours()).toBe(10);
      expect(bogotaDate.getMinutes()).toBe(30);
    });

    it('应该正确转换 UTC 到上海时间', () => {
      const utcDate = new Date('2026-02-05T15:30:00Z');
      const shanghaiDate = convertToTimezone(utcDate, 'Asia/Shanghai');
      
      // UTC+8
      expect(shanghaiDate.getHours()).toBe(23);
      expect(shanghaiDate.getMinutes()).toBe(30);
    });

    it('应该处理跨日转换', () => {
      const utcDate = new Date('2026-02-05T23:30:00Z');
      const shanghaiDate = convertToTimezone(utcDate, 'Asia/Shanghai');
      
      // UTC+8，应该是第二天
      expect(shanghaiDate.getDate()).toBe(6);
      expect(shanghaiDate.getHours()).toBe(7);
    });

    it('应该处理字符串输入', () => {
      const limaDate = convertToTimezone('2026-02-05T15:30:00Z', 'America/Bogota');
      expect(limaDate.getHours()).toBe(10);
    });

    it('应该处理无效日期', () => {
      const result = convertToTimezone('invalid', 'America/Bogota');
      expect(isNaN(result.getTime())).toBe(true);
    });
  });

  describe('getNow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T15:30:00Z'));
    });

    it('应该返回指定时区的当前时间', () => {
      const now = getNow('America/Bogota');
      expect(now.getHours()).toBe(10);
    });
  });

  describe('getTodayStart', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T15:30:00Z'));
    });

    it('应该返回今日 00:00:00', () => {
      const start = getTodayStart('America/Bogota');
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });
  });

  describe('getTodayEnd', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T15:30:00Z'));
    });

    it('应该返回今日 23:59:59.999', () => {
      const end = getTodayEnd('America/Bogota');
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('isInTimeRange', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('在范围内应返回 true', () => {
      // 模拟 Bogota 时间 14:00
      vi.setSystemTime(new Date('2026-02-05T19:00:00Z')); // UTC 19:00 = Bogota 14:00
      expect(isInTimeRange('10:00-17:00', 'America/Bogota')).toBe(true);
    });

    it('在范围外应返回 false', () => {
      // 模拟 Bogota 时间 08:00
      vi.setSystemTime(new Date('2026-02-05T13:00:00Z')); // UTC 13:00 = Bogota 08:00
      expect(isInTimeRange('10:00-17:00', 'America/Bogota')).toBe(false);
    });

    it('边界值应返回 true', () => {
      // 模拟 Bogota 时间 10:00
      vi.setSystemTime(new Date('2026-02-05T15:00:00Z')); // UTC 15:00 = Bogota 10:00
      expect(isInTimeRange('10:00-17:00', 'America/Bogota')).toBe(true);
    });

    it('应该支持跨日时间范围', () => {
      // 模拟 Bogota 时间 23:00
      vi.setSystemTime(new Date('2026-02-06T04:00:00Z')); // UTC 04:00 = Bogota 23:00
      expect(isInTimeRange('22:00-06:00', 'America/Bogota')).toBe(true);

      // 模拟 Bogota 时间 03:00
      vi.setSystemTime(new Date('2026-02-06T08:00:00Z')); // UTC 08:00 = Bogota 03:00
      expect(isInTimeRange('22:00-06:00', 'America/Bogota')).toBe(true);

      // 模拟 Bogota 时间 12:00（不在范围内）
      vi.setSystemTime(new Date('2026-02-06T17:00:00Z')); // UTC 17:00 = Bogota 12:00
      expect(isInTimeRange('22:00-06:00', 'America/Bogota')).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('同一天应返回 true', () => {
      const date1 = new Date('2026-02-05T10:00:00Z');
      const date2 = new Date('2026-02-05T20:00:00Z');
      expect(isSameDay(date1, date2, 'America/Bogota')).toBe(true);
    });

    it('不同天应返回 false', () => {
      const date1 = new Date('2026-02-05T10:00:00Z');
      const date2 = new Date('2026-02-06T10:00:00Z');
      expect(isSameDay(date1, date2, 'America/Bogota')).toBe(false);
    });

    it('应该考虑时区差异', () => {
      // UTC 02:00 在 Bogota 是前一天的 21:00
      const date1 = new Date('2026-02-05T02:00:00Z'); // Bogota: 2026-02-04 21:00
      const date2 = new Date('2026-02-05T10:00:00Z'); // Bogota: 2026-02-05 05:00
      expect(isSameDay(date1, date2, 'America/Bogota')).toBe(false);
    });
  });

  describe('isToday / isYesterday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T15:00:00Z')); // Bogota: 10:00
    });

    it('今天应返回 true', () => {
      const today = new Date('2026-02-05T15:00:00Z');
      expect(isToday(today, 'America/Bogota')).toBe(true);
    });

    it('昨天应该被正确识别', () => {
      const yesterday = new Date('2026-02-04T15:00:00Z');
      expect(isYesterday(yesterday, 'America/Bogota')).toBe(true);
    });
  });

  describe('daysBetween', () => {
    it('应该计算正确的天数差', () => {
      const date1 = new Date('2026-02-01');
      const date2 = new Date('2026-02-05');
      expect(daysBetween(date1, date2)).toBe(4);
    });

    it('顺序无关应返回相同结果', () => {
      const date1 = new Date('2026-02-01');
      const date2 = new Date('2026-02-05');
      expect(daysBetween(date1, date2)).toBe(daysBetween(date2, date1));
    });

    it('同一天应返回 0', () => {
      const date1 = new Date('2026-02-05T10:00:00');
      const date2 = new Date('2026-02-05T20:00:00');
      expect(daysBetween(date1, date2)).toBe(0);
    });
  });

  describe('addHours', () => {
    it('应该正确添加小时', () => {
      const date = new Date('2026-02-05T10:00:00Z');
      const result = addHours(date, 5);
      expect(result.getUTCHours()).toBe(15);
    });

    it('应该支持负数', () => {
      const date = new Date('2026-02-05T10:00:00Z');
      const result = addHours(date, -5);
      expect(result.getUTCHours()).toBe(5);
    });
  });

  describe('addDays', () => {
    it('应该正确添加天数', () => {
      const date = new Date('2026-02-05');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(10);
    });

    it('应该处理跨月', () => {
      const date = new Date('2026-02-28');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(2); // 三月
      expect(result.getDate()).toBe(5);
    });
  });

  describe('addMinutes', () => {
    it('应该正确添加分钟', () => {
      const date = new Date('2026-02-05T10:00:00Z');
      const result = addMinutes(date, 30);
      expect(result.getUTCMinutes()).toBe(30);
    });

    it('应该处理跨小时', () => {
      const date = new Date('2026-02-05T10:45:00Z');
      const result = addMinutes(date, 30);
      expect(result.getUTCHours()).toBe(11);
      expect(result.getUTCMinutes()).toBe(15);
    });
  });

  describe('getSystemDateBounds', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-05T15:00:00Z'));
    });

    it('应该返回今日起止时间', () => {
      const bounds = getSystemDateBounds('America/Bogota');
      
      expect(bounds.start.getHours()).toBe(0);
      expect(bounds.start.getMinutes()).toBe(0);
      expect(bounds.start.getSeconds()).toBe(0);
      
      expect(bounds.end.getHours()).toBe(23);
      expect(bounds.end.getMinutes()).toBe(59);
      expect(bounds.end.getSeconds()).toBe(59);
    });
  });
});
