/**
 * @file 条件高亮行工具
 * @description ProTable rowClassName 工具函数，用于条件高亮表格行
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

/**
 * 高亮类型
 */
export type HighlightType = 'danger' | 'warning' | 'success' | 'info' | 'custom';

/**
 * 高亮配置
 */
export interface HighlightConfig {
  /** 高亮类型 */
  type: HighlightType;
  /** 自定义背景色（type 为 custom 时使用） */
  backgroundColor?: string;
  /** 透明度（0-1，默认0.08） */
  opacity?: number;
}

/**
 * 高亮规则
 */
export interface HighlightRule<T = Record<string, unknown>> {
  /** 条件判断函数 */
  condition: (record: T, index: number) => boolean;
  /** 高亮配置 */
  config: HighlightConfig;
}

/**
 * 预设高亮颜色
 */
const HIGHLIGHT_COLORS: Record<Exclude<HighlightType, 'custom'>, string> = {
  danger: '255, 77, 79',    // #ff4d4f - 红色
  warning: '255, 152, 0',   // #ff9800 - 橙色
  success: '82, 196, 26',   // #52c41a - 绿色
  info: '22, 119, 255',     // #1677ff - 蓝色
};

/**
 * 获取高亮行类名生成函数
 * @description 用于 ProTable 的 rowClassName 属性
 * @param rules - 高亮规则数组
 * @returns rowClassName 函数
 * @example
 * const rowClassName = getHighlightRowClassName([
 *   {
 *     condition: (record) => record.status === 'BANNED',
 *     config: { type: 'danger' }
 *   },
 *   {
 *     condition: (record) => record.status === 'PENDING',
 *     config: { type: 'warning' }
 *   }
 * ]);
 *
 * <ProTable rowClassName={rowClassName} />
 */
export function getHighlightRowClassName<T = Record<string, unknown>>(
  rules: HighlightRule<T>[]
): (record: T, index: number) => string {
  return (record: T, index: number): string => {
    for (const rule of rules) {
      if (rule.condition(record, index)) {
        return `highlight-row-${rule.config.type}`;
      }
    }
    return '';
  };
}

/**
 * 生成高亮行的 CSS 样式
 * @description 在全局样式或组件中使用
 * @param rules - 高亮规则数组
 * @returns CSS 样式字符串
 */
export function generateHighlightStyles<T = Record<string, unknown>>(
  rules: HighlightRule<T>[]
): string {
  const styles: string[] = [];

  rules.forEach((rule) => {
    const { type, backgroundColor, opacity = 0.08 } = rule.config;

    let color: string;
    if (type === 'custom' && backgroundColor) {
      // 解析自定义颜色
      color = backgroundColor.startsWith('#')
        ? hexToRgb(backgroundColor)
        : backgroundColor;
    } else if (type !== 'custom') {
      color = HIGHLIGHT_COLORS[type];
    } else {
      return;
    }

    styles.push(`
      .highlight-row-${type} {
        background-color: rgba(${color}, ${opacity}) !important;
      }
      .highlight-row-${type}:hover > td {
        background-color: rgba(${color}, ${opacity + 0.04}) !important;
      }
    `);
  });

  return styles.join('\n');
}

/**
 * 十六进制颜色转 RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * 预设的高亮行类名
 * @description 直接在 CSS 中定义，无需动态生成
 */
export const HIGHLIGHT_ROW_CLASSES = {
  /** 危险/封禁 - 红色背景 */
  danger: 'highlight-row-danger',
  /** 警告/待审核 - 橙色背景 */
  warning: 'highlight-row-warning',
  /** 成功 - 绿色背景 */
  success: 'highlight-row-success',
  /** 信息 - 蓝色背景 */
  info: 'highlight-row-info',
} as const;

/**
 * 高亮行全局样式
 * @description 在全局样式文件中引入
 */
export const HIGHLIGHT_ROW_STYLES = `
  /* 危险/封禁状态 - 红色背景 */
  .highlight-row-danger {
    background-color: rgba(255, 77, 79, 0.08) !important;
  }
  .highlight-row-danger:hover > td {
    background-color: rgba(255, 77, 79, 0.12) !important;
  }

  /* 警告/待审核状态 - 橙色背景 */
  .highlight-row-warning {
    background-color: rgba(255, 152, 0, 0.08) !important;
  }
  .highlight-row-warning:hover > td {
    background-color: rgba(255, 152, 0, 0.12) !important;
  }

  /* 成功状态 - 绿色背景 */
  .highlight-row-success {
    background-color: rgba(82, 196, 26, 0.08) !important;
  }
  .highlight-row-success:hover > td {
    background-color: rgba(82, 196, 26, 0.12) !important;
  }

  /* 信息状态 - 蓝色背景 */
  .highlight-row-info {
    background-color: rgba(22, 119, 255, 0.08) !important;
  }
  .highlight-row-info:hover > td {
    background-color: rgba(22, 119, 255, 0.12) !important;
  }
`;

/**
 * 用户列表高亮规则（预设示例）
 * @description 封禁用户显示红色背景
 */
export function getUserRowClassName(record: { status?: string }, _index: number): string {
  if (record.status === 'BANNED') {
    return HIGHLIGHT_ROW_CLASSES.danger;
  }
  return '';
}

/**
 * 提现列表高亮规则（预设示例）
 * @description 待审核显示橙色，失败显示红色
 */
export function getWithdrawRowClassName(record: { status?: string }, _index: number): string {
  if (record.status === 'PENDING_REVIEW') {
    return HIGHLIGHT_ROW_CLASSES.warning;
  }
  if (record.status === 'FAILED' || record.status === 'REJECTED') {
    return HIGHLIGHT_ROW_CLASSES.danger;
  }
  return '';
}

/**
 * 收益列表高亮规则（预设示例）
 * @description 待发放显示橙色，失败显示红色
 */
export function getIncomeRowClassName(record: { status?: string }, _index: number): string {
  if (record.status === 'PENDING') {
    return HIGHLIGHT_ROW_CLASSES.warning;
  }
  if (record.status === 'FAILED') {
    return HIGHLIGHT_ROW_CLASSES.danger;
  }
  return '';
}

export default getHighlightRowClassName;
