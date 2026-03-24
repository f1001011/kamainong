/**
 * @file 加密解密工具
 * @description 提供 AES 加密/解密、bcrypt 哈希/验证、数据脱敏等功能
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第5节 - 数据安全
 * 
 * 安全规则：
 * - AES 密钥从环境变量 AES_SECRET_KEY 读取，禁止硬编码
 * - 用户密码使用 AES 加密存储（后台可解密查看）
 * - 管理员密码使用 bcrypt 哈希存储（不可逆）
 * - 银行卡号、证件号等敏感数据使用 AES 加密存储
 */

import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

/**
 * bcrypt 哈希轮数
 * 10 轮提供良好的安全性和性能平衡
 */
const BCRYPT_ROUNDS = 10;

/**
 * AES 加密
 * @description 依据：02.1-数据库设计.md 第5.1节 - 用户密码、银行卡号使用 AES-256 加密
 * 用于加密用户密码、银行卡号、证件号等敏感信息
 * @param text - 待加密的明文
 * @param key - AES 密钥（可选，默认从环境变量 AES_SECRET_KEY 读取）
 * @returns 加密后的密文
 * @throws Error 当 AES_SECRET_KEY 未定义时抛出错误
 * @example
 * const encrypted = aesEncrypt('123456');          // 使用环境变量密钥
 * const encrypted = aesEncrypt('123456', 'myKey'); // 使用自定义密钥
 */
export function aesEncrypt(text: string, key?: string): string {
  const secretKey = key || process.env.AES_SECRET_KEY;
  if (!secretKey) {
    throw new Error('AES_SECRET_KEY is not defined');
  }
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

/**
 * AES 解密
 * @description 依据：02.1-数据库设计.md 第5.1节 - 后台可解密查看用户密码
 * @param ciphertext - 待解密的密文
 * @param key - AES 密钥（可选，默认从环境变量 AES_SECRET_KEY 读取）
 * @returns 解密后的明文
 * @throws Error 当 AES_SECRET_KEY 未定义时抛出错误
 * @example
 * const plaintext = aesDecrypt(encrypted);          // 使用环境变量密钥
 * const plaintext = aesDecrypt(encrypted, 'myKey'); // 使用自定义密钥
 */
export function aesDecrypt(ciphertext: string, key?: string): string {
  const secretKey = key || process.env.AES_SECRET_KEY;
  if (!secretKey) {
    throw new Error('AES_SECRET_KEY is not defined');
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * bcrypt 哈希
 * @description 依据：02.1-数据库设计.md 第5.1节 - 管理员密码使用 bcrypt 哈希
 * 用于管理员密码的不可逆哈希，保证即使数据库泄露也无法还原密码
 * @param password - 待哈希的明文密码
 * @returns 哈希后的密码字符串
 * @example
 * const hash = await bcryptHash('admin123');
 */
export async function bcryptHash(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * bcrypt 验证
 * @description 验证明文密码是否与哈希值匹配
 * @param password - 待验证的明文密码
 * @param hash - 存储的哈希值
 * @returns 是否匹配
 * @example
 * const isValid = await bcryptVerify('admin123', storedHash);
 */
export async function bcryptVerify(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 银行卡号脱敏处理
 * @description 依据：02.1-数据库设计.md - BankCard.accountNoMask 字段
 * 显示格式：****1234（仅显示后4位）
 * @param accountNo - 完整银行卡号
 * @returns 脱敏后的卡号
 * @example
 * maskAccountNo('1234567890123456'); // "****3456"
 * maskAccountNo('123');              // "****"
 */
export function maskAccountNo(accountNo: string): string {
  if (!accountNo || accountNo.length <= 4) {
    return '****';
  }
  return '****' + accountNo.slice(-4);
}

/**
 * 手机号脱敏处理
 * @description 显示格式：****5678（仅显示后4位）
 * @param phone - 完整手机号
 * @returns 脱敏后的手机号
 * @example
 * maskPhone('912345678'); // "****5678"
 * maskPhone('123');       // "****"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) {
    return '****';
  }
  return '****' + phone.slice(-4);
}

/**
 * 证件号脱敏处理
 * @description 显示格式：12****78（保留首尾各2位）
 * @param documentNo - 完整证件号
 * @returns 脱敏后的证件号
 * @example
 * maskDocumentNo('12345678'); // "12****78"
 * maskDocumentNo('123');      // "****"
 */
export function maskDocumentNo(documentNo: string): string {
  if (!documentNo || documentNo.length <= 4) {
    return '****';
  }
  const start = documentNo.slice(0, 2);
  const end = documentNo.slice(-2);
  return `${start}****${end}`;
}

/**
 * 邮箱脱敏处理
 * @description 显示格式：te****@example.com（用户名保留前2位）
 * @param email - 完整邮箱地址
 * @returns 脱敏后的邮箱
 * @example
 * maskEmail('test@example.com'); // "te****@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '****';
  }
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username}****@${domain}`;
  }
  return `${username.slice(0, 2)}****@${domain}`;
}

/**
 * SHA256 哈希（确定性）
 * @description 用于敏感数据的唯一性检查，如银行卡号查重
 * 由于 AES 加密是非确定性的（每次加密结果不同），无法直接用于查重
 * 因此需要使用 SHA256 生成确定性的哈希值进行唯一性校验
 * @param text - 待哈希的明文
 * @returns SHA256 哈希值（64位十六进制字符串）
 * @example
 * sha256Hash('1234567890123456'); // "a1b2c3d4..." (64位)
 */
export function sha256Hash(text: string): string {
  return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}
