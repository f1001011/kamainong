/**
 * @file 消息通知相关类型定义
 * @description 站内通知类型、接口定义
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.11节 - Notification表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 */

/**
 * 消息类型枚举
 * @description 依据：02.1-数据库设计.md 第2.11节 NotificationType枚举
 */
export type NotificationType =
  | 'RECHARGE_SUCCESS'      // 充值成功
  | 'WITHDRAW_APPROVED'     // 提现审核通过
  | 'WITHDRAW_COMPLETED'    // 提现完成
  | 'WITHDRAW_REJECTED'     // 提现被拒绝
  | 'WITHDRAW_FAILED'       // 提现失败
  | 'INCOME_RECEIVED'       // 收益到账
  | 'COMMISSION_RECEIVED'   // 返佣到账
  | 'SIGN_IN_REWARD'        // 签到奖励
  | 'ACTIVITY_REWARD'       // 活动奖励
  | 'SYSTEM_ANNOUNCEMENT';  // 系统公告

/**
 * 消息项接口
 * @description 依据：02.3-前端API接口清单.md 第14.1节
 */
export interface NotificationItem {
  /** 消息ID */
  id: number;
  /** 消息类型 */
  type: NotificationType;
  /** 消息标题 */
  title: string;
  /** 消息内容（列表页预览内容，详情页为完整内容） */
  content: string;
  /** 是否已读 */
  isRead: boolean;
  /** 创建时间（ISO8601格式） */
  createdAt: string;
}

/**
 * 消息列表响应
 * @description 依据：02.3-前端API接口清单.md 第14.1节
 */
export interface NotificationListResponse {
  /** 消息列表 */
  list: NotificationItem[];
  /** 分页信息 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** 未读数量 */
  unreadCount: number;
}

/**
 * 消息日期分组
 * @description 用于按日期聚合消息
 */
export interface MessageGroup {
  /** 日期（ISO日期格式，如 2026-02-04） */
  date: string;
  /** 该日期下的消息列表 */
  messages: NotificationItem[];
}

/**
 * 消息类型配置项
 * @description 用于映射消息类型到图标和颜色
 */
export interface NotificationTypeConfig {
  /** Remix Icon 组件 */
  icon: React.ElementType;
  /** 图标颜色类名 */
  iconColor: string;
  /** 背景渐变类名 */
  bgGradient: string;
}
