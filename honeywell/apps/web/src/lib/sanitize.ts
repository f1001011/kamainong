/**
 * @file XSS 防护工具
 * @description 使用 DOMPurify 对用户输入和富文本内容进行消毒
 * @depends 开发文档/03-前端/03.3.2-产品详情页.md - XSS防护要求
 */

import DOMPurify, { type Config } from 'dompurify';

/**
 * 默认 DOMPurify 配置
 * 允许常见的富文本标签和属性，禁止脚本和危险内容
 */
const DEFAULT_CONFIG: Config = {
  // 允许的HTML标签（常见富文本标签）
  ALLOWED_TAGS: [
    // 文本格式
    'p', 'br', 'span', 'div',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'sub', 'sup', 'small',
    // 标题
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 列表
    'ul', 'ol', 'li',
    // 表格
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    // 引用和代码
    'blockquote', 'pre', 'code',
    // 链接和图片
    'a', 'img',
    // 其他
    'hr',
  ],
  // 允许的属性
  ALLOWED_ATTR: [
    // 通用属性
    'class', 'id', 'style',
    // 链接属性
    'href', 'target', 'rel',
    // 图片属性
    'src', 'alt', 'width', 'height', 'loading',
    // 表格属性
    'colspan', 'rowspan',
  ],
  // 允许的URI协议（防止javascript:等危险协议）
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // 自动添加rel属性防止钓鱼
  ADD_ATTR: ['target'],
  // 对所有外部链接添加安全属性
  ALLOW_ARIA_ATTR: true,
  ALLOW_DATA_ATTR: false, // 禁止data-*属性以防止XSS
};

/**
 * 消毒HTML内容
 * @param dirty 可能包含恶意代码的HTML字符串
 * @param config 可选的DOMPurify配置，会与默认配置合并
 * @returns 安全的HTML字符串
 * @example
 * // 基本用法
 * const safeHtml = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
 * // 结果: '<p>Hello</p>'
 */
export function sanitizeHtml(dirty: string, config?: Config): string {
  if (!dirty) return '';
  
  const mergedConfig = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;
  
  // 检查是否在浏览器环境
  if (typeof window === 'undefined') {
    // 服务端渲染时，进行基础过滤
    // 注意：这只是基础保护，完整的DOMPurify需要DOM环境
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }
  
  return DOMPurify.sanitize(dirty, mergedConfig) as unknown as string;
}

/**
 * 消毒纯文本（移除所有HTML标签）
 * @param dirty 可能包含HTML的字符串
 * @returns 纯文本字符串
 * @example
 * const plainText = sanitizeText('<p>Hello <b>World</b></p>');
 * // 结果: 'Hello World'
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  
  if (typeof window === 'undefined') {
    // 服务端：移除所有HTML标签
    return dirty.replace(/<[^>]*>/g, '');
  }
  
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }) as unknown as string;
}

/**
 * 为链接添加安全属性
 * @description 对外部链接添加 rel="noopener noreferrer" 防止钓鱼攻击
 * 只在客户端环境注册hook，服务端渲染时跳过
 */
if (typeof window !== 'undefined' && DOMPurify.addHook) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // 为所有target="_blank"的链接添加安全属性
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
    
    // 为所有图片添加loading="lazy"
    if (node.tagName === 'IMG' && !node.getAttribute('loading')) {
      node.setAttribute('loading', 'lazy');
    }
  });
}

export default DOMPurify;
