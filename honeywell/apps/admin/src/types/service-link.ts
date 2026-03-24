/**
 * @file 客服链接类型定义
 * @description 客服链接配置相关类型
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.3-客服链接配置页.md
 */

/**
 * 预设图标标识
 * 注意：使用小写字符串格式，与前端 FloatingService 组件的图标映射保持一致
 */
export type PresetIcon =
  | 'telegram'           // Telegram
  | 'whatsapp'           // WhatsApp
  | 'online_service'     // 在线客服
  | 'messenger'          // Messenger
  | 'line'               // LINE
  | 'wechat'             // 微信（备用）
  | 'email'              // 邮箱
  | 'phone';             // 电话

/**
 * 客服链接数据结构
 * 依据：02.1-数据库设计.md 2.7节 - GlobalConfig.service_links
 */
export interface ServiceLink {
  /** 数组索引，用于标识（API返回时自动添加） */
  index?: number;
  
  /** 客服渠道名称 */
  name: string;
  
  /** 图标（预设图标标识或自定义图片URL） */
  icon: string;
  
  /** 跳转链接URL */
  url: string;
  
  /** 是否启用 */
  isActive: boolean;
}

/**
 * 客服链接表单值（用于前端表单处理）
 */
export interface ServiceLinkFormValues {
  /** 客服渠道名称 */
  name: string;
  
  /** 图标类型：预设/自定义 */
  iconType: 'preset' | 'custom';
  
  /** 预设图标标识 */
  presetIcon?: PresetIcon;
  
  /** 自定义图标URL */
  customIcon?: string;
  
  /** 跳转链接 */
  url: string;
  
  /** 是否启用 */
  isActive: boolean;
}

/**
 * 客服链接列表API响应
 */
export interface ServiceLinksResponse {
  list: ServiceLink[];
}

/**
 * 更新客服链接请求
 */
export interface UpdateServiceLinksRequest {
  list: Omit<ServiceLink, 'index'>[];
}

/**
 * 预设图标配置
 */
export interface PresetIconConfig {
  /** 图标标识 */
  value: PresetIcon;
  /** 显示名称 */
  label: string;
  /** 推荐颜色 */
  color: string;
}

/**
 * 预设图标列表
 * 用于图标选择器
 */
export const PRESET_ICONS: PresetIconConfig[] = [
  { value: 'telegram', label: 'Telegram', color: '#0088cc' },
  { value: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { value: 'online_service', label: '在线客服', color: '#ff6b00' },
  { value: 'messenger', label: 'Messenger', color: '#006AFF' },
  { value: 'line', label: 'LINE', color: '#00B900' },
  { value: 'wechat', label: '微信', color: '#07C160' },
  { value: 'email', label: '邮箱', color: '#EA4335' },
  { value: 'phone', label: '电话', color: '#34A853' },
];

/**
 * 预设图标颜色映射
 */
export const PRESET_ICON_COLORS: Record<string, string> = {
  telegram: '#0088cc',
  whatsapp: '#25D366',
  online_service: '#ff6b00',
  messenger: '#006AFF',
  line: '#00B900',
  wechat: '#07C160',
  email: '#EA4335',
  phone: '#34A853',
};
