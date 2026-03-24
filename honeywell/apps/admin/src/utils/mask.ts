/**
 * @file 脱敏工具函数
 * @description 敏感信息脱敏处理
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

/**
 * 手机号脱敏
 * @description 显示前3后2位，中间用****替换
 * @param phone - 手机号
 * @returns 脱敏后的手机号
 * @example
 * maskPhone('13800138000') // '138****00'
 * maskPhone('913456789')   // '913****89'
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // 清理非数字字符
  const cleaned = phone.replace(/\D/g, '');
  
  // 长度小于5位直接返回
  if (cleaned.length < 5) {
    return cleaned;
  }
  
  // 显示前3后2，中间****
  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-2);
  return `${prefix}****${suffix}`;
}

/**
 * 银行卡号脱敏
 * @description 只显示后4位，前面用****替换
 * @param cardNo - 银行卡号
 * @returns 脱敏后的银行卡号
 * @example
 * maskBankCard('6222021234567890') // '****7890'
 */
export function maskBankCard(cardNo: string | null | undefined): string {
  if (!cardNo) return '-';
  
  // 清理非数字字符
  const cleaned = cardNo.replace(/\D/g, '');
  
  // 长度小于4位直接返回
  if (cleaned.length < 4) {
    return cleaned;
  }
  
  // 只显示后4位
  const suffix = cleaned.slice(-4);
  return `****${suffix}`;
}

/**
 * 身份证号脱敏
 * @description 显示前4后4位，中间用****替换
 * @param idCard - 身份证号
 * @returns 脱敏后的身份证号
 * @example
 * maskIdCard('110101199001011234') // '1101****1234'
 */
export function maskIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '-';
  
  // 长度小于8位直接返回
  if (idCard.length < 8) {
    return idCard;
  }
  
  // 显示前4后4，中间****
  const prefix = idCard.slice(0, 4);
  const suffix = idCard.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * 邮箱脱敏
 * @description 显示前2位和@后部分，中间用***替换
 * @param email - 邮箱地址
 * @returns 脱敏后的邮箱
 * @example
 * maskEmail('example@gmail.com') // 'ex***@gmail.com'
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '-';
  
  const atIndex = email.indexOf('@');
  if (atIndex < 2) {
    return email;
  }
  
  const prefix = email.slice(0, 2);
  const suffix = email.slice(atIndex);
  return `${prefix}***${suffix}`;
}

/**
 * 姓名脱敏
 * @description 只显示第一个字，其余用*替换
 * @param name - 姓名
 * @returns 脱敏后的姓名
 * @example
 * maskName('张三') // '张*'
 * maskName('张三丰') // '张**'
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return '-';
  
  if (name.length === 1) {
    return name;
  }
  
  const first = name.charAt(0);
  const mask = '*'.repeat(name.length - 1);
  return `${first}${mask}`;
}

/**
 * IP地址脱敏
 * @description 隐藏最后一段
 * @param ip - IP地址
 * @returns 脱敏后的IP
 * @example
 * maskIp('192.168.1.100') // '192.168.1.***'
 */
export function maskIp(ip: string | null | undefined): string {
  if (!ip) return '-';
  
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return ip;
  }
  
  parts[3] = '***';
  return parts.join('.');
}

/**
 * 通用脱敏函数
 * @description 保留前后指定位数，中间用指定字符替换
 * @param text - 原始文本
 * @param prefixLength - 保留前缀长度
 * @param suffixLength - 保留后缀长度
 * @param maskChar - 脱敏字符
 * @param maskLength - 脱敏字符长度（默认为4）
 * @returns 脱敏后的文本
 */
export function maskText(
  text: string | null | undefined,
  prefixLength: number,
  suffixLength: number,
  maskChar: string = '*',
  maskLength: number = 4
): string {
  if (!text) return '-';
  
  const minLength = prefixLength + suffixLength;
  if (text.length <= minLength) {
    return text;
  }
  
  const prefix = text.slice(0, prefixLength);
  const suffix = text.slice(-suffixLength);
  const mask = maskChar.repeat(maskLength);
  
  return `${prefix}${mask}${suffix}`;
}
