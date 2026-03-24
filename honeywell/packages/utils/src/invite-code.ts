/**
 * @file 邀请码生成工具
 * @description 生成和验证用户邀请码
 * @depends 开发文档/02-数据层/02.1-数据库设计.md - User.inviteCode 字段定义
 * 
 * 邀请码规则：
 * - 固定 8 位字符
 * - 字符集：大写字母 + 数字，排除易混淆字符 0、O、1、I、L
 * - 最终字符集：ABCDEFGHJKMNPQRSTUVWXYZ23456789（30个字符）
 */

/**
 * 邀请码字符集
 * 排除易混淆字符：0（与O混淆）、O（与0混淆）、1（与I/L混淆）、I（与1/L混淆）、L（与1/I混淆）
 */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * 邀请码固定长度
 */
const INVITE_CODE_LENGTH = 8;

/**
 * 生成随机邀请码
 * @description 依据：02.1-数据库设计.md - User.inviteCode 为 8 位，排除 0OIL1
 * @returns 8 位随机邀请码
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return code;
}

/**
 * 验证邀请码格式
 * @param code - 待验证的邀请码
 * @returns 是否为有效格式的邀请码
 */
export function isValidInviteCode(code: string): boolean {
  if (code.length !== INVITE_CODE_LENGTH) {
    return false;
  }

  // 验证字符集：A-H, J-K, M-N, P-Z, 2-9（排除 0, O, 1, I, L）
  const regex = /^[A-HJ-KM-NP-Z2-9]{8}$/;
  return regex.test(code);
}

/**
 * 从邀请链接中提取邀请码
 * 支持格式：
 * - https://domain.com/register?code=ABC123
 * - https://domain.com/invite/ABC123
 */
export function extractInviteCode(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // 从查询参数获取
    const codeParam = urlObj.searchParams.get('code');
    if (codeParam && isValidInviteCode(codeParam)) {
      return codeParam;
    }

    // 从路径获取
    const pathParts = urlObj.pathname.split('/');
    const inviteIndex = pathParts.indexOf('invite');
    if (inviteIndex !== -1 && pathParts[inviteIndex + 1]) {
      const code = pathParts[inviteIndex + 1];
      if (isValidInviteCode(code)) {
        return code;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 生成邀请链接
 */
export function generateInviteLink(
  inviteCode: string,
  siteDomain: string
): string {
  return `https://${siteDomain}/register?code=${inviteCode}`;
}
