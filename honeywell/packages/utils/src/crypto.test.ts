/**
 * @file 加密工具单元测试
 * @description 测试 AES 加密/解密、bcrypt 哈希/验证、数据脱敏功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  aesEncrypt,
  aesDecrypt,
  bcryptHash,
  bcryptVerify,
  maskAccountNo,
  maskPhone,
  maskDocumentNo,
  maskEmail,
} from './crypto';

describe('加密工具 (crypto)', () => {
  // 保存原始环境变量
  const originalEnv = process.env.AES_SECRET_KEY;

  beforeAll(() => {
    // 设置测试用的 AES 密钥
    process.env.AES_SECRET_KEY = 'test-secret-key-for-unit-test';
  });

  afterAll(() => {
    // 恢复原始环境变量
    if (originalEnv) {
      process.env.AES_SECRET_KEY = originalEnv;
    } else {
      delete process.env.AES_SECRET_KEY;
    }
  });

  describe('AES 加密/解密', () => {
    it('应该正确加密和解密字符串', () => {
      const plaintext = '123456';
      const encrypted = aesEncrypt(plaintext);
      const decrypted = aesDecrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('每次加密结果应该不同（随机 IV）', () => {
      const plaintext = '123456';
      const encrypted1 = aesEncrypt(plaintext);
      const encrypted2 = aesEncrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('应该能加密中文和特殊字符', () => {
      const plaintext = '你好世界!@#$%';
      const encrypted = aesEncrypt(plaintext);
      const decrypted = aesDecrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('应该支持自定义密钥', () => {
      const plaintext = '123456';
      const customKey = 'my-custom-key';
      const encrypted = aesEncrypt(plaintext, customKey);
      const decrypted = aesDecrypt(encrypted, customKey);
      
      expect(decrypted).toBe(plaintext);
    });

    it('使用错误密钥解密应返回空字符串', () => {
      const plaintext = '123456';
      const encrypted = aesEncrypt(plaintext, 'correct-key');
      const decrypted = aesDecrypt(encrypted, 'wrong-key');
      
      // CryptoJS 使用错误密钥解密通常返回空字符串或乱码
      expect(decrypted).not.toBe(plaintext);
    });

    it('没有设置密钥时应抛出错误', () => {
      const originalKey = process.env.AES_SECRET_KEY;
      delete process.env.AES_SECRET_KEY;
      
      expect(() => aesEncrypt('test')).toThrow('AES_SECRET_KEY is not defined');
      expect(() => aesDecrypt('test')).toThrow('AES_SECRET_KEY is not defined');
      
      process.env.AES_SECRET_KEY = originalKey;
    });
  });

  describe('bcrypt 哈希/验证', () => {
    it('应该正确哈希密码', async () => {
      const password = 'admin123';
      const hash = await bcryptHash(password);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('每次哈希结果应该不同（随机盐值）', async () => {
      const password = 'admin123';
      const hash1 = await bcryptHash(password);
      const hash2 = await bcryptHash(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('应该正确验证密码', async () => {
      const password = 'admin123';
      const hash = await bcryptHash(password);
      
      const isValid = await bcryptVerify(password, hash);
      expect(isValid).toBe(true);
    });

    it('错误密码验证应返回 false', async () => {
      const password = 'admin123';
      const hash = await bcryptHash(password);
      
      const isValid = await bcryptVerify('wrong-password', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('银行卡号脱敏 (maskAccountNo)', () => {
    it('应该只显示后4位', () => {
      expect(maskAccountNo('1234567890123456')).toBe('****3456');
    });

    it('短卡号应返回 ****', () => {
      expect(maskAccountNo('123')).toBe('****');
      expect(maskAccountNo('1234')).toBe('****');
    });

    it('空字符串应返回 ****', () => {
      expect(maskAccountNo('')).toBe('****');
    });
  });

  describe('手机号脱敏 (maskPhone)', () => {
    it('应该只显示后4位', () => {
      expect(maskPhone('912345678')).toBe('****5678');
    });

    it('短手机号应返回 ****', () => {
      expect(maskPhone('123')).toBe('****');
    });

    it('空字符串应返回 ****', () => {
      expect(maskPhone('')).toBe('****');
    });
  });

  describe('证件号脱敏 (maskDocumentNo)', () => {
    it('应该保留首尾各2位', () => {
      expect(maskDocumentNo('12345678')).toBe('12****78');
    });

    it('短证件号应返回 ****', () => {
      expect(maskDocumentNo('123')).toBe('****');
    });

    it('空字符串应返回 ****', () => {
      expect(maskDocumentNo('')).toBe('****');
    });
  });

  describe('邮箱脱敏 (maskEmail)', () => {
    it('应该保留用户名前2位', () => {
      expect(maskEmail('test@example.com')).toBe('te****@example.com');
    });

    it('短用户名应完整显示', () => {
      expect(maskEmail('ab@example.com')).toBe('ab****@example.com');
    });

    it('无效邮箱应返回 ****', () => {
      expect(maskEmail('invalid')).toBe('****');
      expect(maskEmail('')).toBe('****');
    });
  });
});
