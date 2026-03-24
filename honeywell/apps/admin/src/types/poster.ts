/**
 * @file 邀请海报配置类型定义
 * @description 海报配置相关的TypeScript类型
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.4-邀请海报配置页.md
 */

/**
 * 海报配置数据结构
 * @description 依据：02.1-数据库设计.md 2.7节 - GlobalConfig配置项
 */
export interface PosterConfig {
  /** 海报背景图URL */
  backgroundImage: string;
  
  /** 二维码X坐标（百分比，0-100） */
  qrCodePositionX: number;
  
  /** 二维码Y坐标（百分比，0-100） */
  qrCodePositionY: number;
  
  /** 二维码尺寸（像素，建议80-300） */
  qrCodeSize: number;
  
  /** 邀请码X坐标（百分比，0-100） */
  inviteCodePositionX: number;
  
  /** 邀请码Y坐标（百分比，0-100） */
  inviteCodePositionY: number;
  
  /** 邀请码字体大小（像素，建议12-48） */
  inviteCodeFontSize: number;
  
  /** 邀请码字体颜色（十六进制色值） */
  inviteCodeColor: string;
}

/**
 * 海报配置表单类型
 * @description 用于表单提交
 */
export type PosterConfigFormValues = PosterConfig;

/**
 * 海报配置更新请求
 * @description 所有字段都可选，只更新传入的字段
 */
export type UpdatePosterConfigRequest = Partial<PosterConfig>;

/**
 * 海报配置默认值
 * @description 依据：04.8.4-邀请海报配置页.md 第6节 - 配置项详情
 */
export const DEFAULT_POSTER_CONFIG: PosterConfig = {
  backgroundImage: '',
  qrCodePositionX: 37,
  qrCodePositionY: 78,
  qrCodeSize: 180,
  inviteCodePositionX: 50,
  inviteCodePositionY: 94,
  inviteCodeFontSize: 16,
  inviteCodeColor: '#333333',
};

/**
 * 配置项取值范围
 * @description 用于表单验证
 */
export const POSTER_CONFIG_LIMITS = {
  qrCodePositionX: { min: 0, max: 100 },
  qrCodePositionY: { min: 0, max: 100 },
  qrCodeSize: { min: 80, max: 300 },
  inviteCodePositionX: { min: 0, max: 100 },
  inviteCodePositionY: { min: 0, max: 100 },
  inviteCodeFontSize: { min: 12, max: 48 },
};

/**
 * 示例邀请码（用于预览）
 */
export const SAMPLE_INVITE_CODE = 'ABC12DEF';

/**
 * 示例邀请链接（用于预览二维码）
 */
export const SAMPLE_INVITE_URL = 'https://example.com/register?code=SAMPLE';
