/**
 * @file 邀请码工具单元测试
 * @description 测试邀请码生成、验证、链接处理功能
 */

import { describe, it, expect } from 'vitest';
import {
  generateInviteCode,
  isValidInviteCode,
  extractInviteCode,
  generateInviteLink,
} from './invite-code';

describe('邀请码工具 (invite-code)', () => {
  describe('generateInviteCode', () => {
    it('应该生成 8 位邀请码', () => {
      const code = generateInviteCode();
      expect(code.length).toBe(8);
    });

    it('生成的邀请码不应包含易混淆字符 0、O、1、I、L', () => {
      // 生成多个邀请码进行测试
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        expect(code).not.toMatch(/[0OIL1]/);
      }
    });

    it('生成的邀请码应该只包含有效字符', () => {
      const validChars = /^[A-HJ-KM-NP-Z2-9]{8}$/;
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        expect(code).toMatch(validChars);
      }
    });

    it('生成的邀请码应该是唯一的（大概率）', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        codes.add(generateInviteCode());
      }
      // 1000 个邀请码应该几乎没有重复
      expect(codes.size).toBeGreaterThan(990);
    });
  });

  describe('isValidInviteCode', () => {
    it('有效的邀请码应返回 true', () => {
      expect(isValidInviteCode('ABCD2345')).toBe(true);
      expect(isValidInviteCode('WXYZ6789')).toBe(true);
      expect(isValidInviteCode('HJKM2345')).toBe(true);
    });

    it('长度不是 8 位应返回 false', () => {
      expect(isValidInviteCode('ABC123')).toBe(false);
      expect(isValidInviteCode('ABCDEFGHI')).toBe(false);
      expect(isValidInviteCode('')).toBe(false);
    });

    it('包含易混淆字符应返回 false', () => {
      expect(isValidInviteCode('ABC0WXYZ')).toBe(false); // 包含 0
      expect(isValidInviteCode('ABCOWXYZ')).toBe(false); // 包含 O
      expect(isValidInviteCode('ABC1WXYZ')).toBe(false); // 包含 1
      expect(isValidInviteCode('ABCIWXYZ')).toBe(false); // 包含 I
      expect(isValidInviteCode('ABCLWXYZ')).toBe(false); // 包含 L
    });

    it('包含小写字母应返回 false', () => {
      expect(isValidInviteCode('ABCDwxyz')).toBe(false);
    });

    it('包含特殊字符应返回 false', () => {
      expect(isValidInviteCode('ABCD@#$!')).toBe(false);
    });
  });

  describe('extractInviteCode', () => {
    it('应该从查询参数提取邀请码', () => {
      const url = 'https://example.com/register?code=ABCD2345';
      expect(extractInviteCode(url)).toBe('ABCD2345');
    });

    it('应该从路径提取邀请码', () => {
      const url = 'https://example.com/invite/ABCD2345';
      expect(extractInviteCode(url)).toBe('ABCD2345');
    });

    it('无效的邀请码链接应返回 null', () => {
      expect(extractInviteCode('https://example.com/register?code=invalid')).toBe(null);
      expect(extractInviteCode('https://example.com/register')).toBe(null);
    });

    it('无效的 URL 应返回 null', () => {
      expect(extractInviteCode('not-a-url')).toBe(null);
      expect(extractInviteCode('')).toBe(null);
    });

    it('带有其他参数的 URL 应正确提取', () => {
      const url = 'https://example.com/register?ref=google&code=ABCD2345&lang=es';
      expect(extractInviteCode(url)).toBe('ABCD2345');
    });
  });

  describe('generateInviteLink', () => {
    it('应该生成正确的邀请链接', () => {
      const link = generateInviteLink('ABCD2345', 'example.com');
      expect(link).toBe('https://example.com/register?code=ABCD2345');
    });

    it('应该处理不同的域名', () => {
      const link = generateInviteLink('WXYZ6789', 'www.LLES-co.com');
      expect(link).toBe('https://www.LLES-co.com/register?code=WXYZ6789');
    });
  });
});
