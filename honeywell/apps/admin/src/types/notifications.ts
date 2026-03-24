/**
 * @file 站内信类型定义
 * @description 站内信管理相关的类型定义
 * @depends 开发文档/开发文档.md 第13.12节 站内信管理
 */

/**
 * 消息类型枚举
 * @description 系统支持的站内信类型，与 Prisma schema NotificationType 枚举保持一致
 */
export type NotificationType =
  | 'RECHARGE_SUCCESS'    // 充值成功
  | 'WITHDRAW_APPROVED'   // 提现审核通过
  | 'WITHDRAW_COMPLETED'  // 提现完成
  | 'WITHDRAW_REJECTED'   // 提现被拒绝
  | 'WITHDRAW_FAILED'     // 提现失败
  | 'INCOME_RECEIVED'     // 收益到账
  | 'COMMISSION_RECEIVED' // 返佣到账
  | 'SIGN_IN_REWARD'      // 签到奖励到账
  | 'ACTIVITY_REWARD'     // 活动奖励到账
  | 'SYSTEM_ANNOUNCEMENT'; // 系统公告

/**
 * 消息类型配置
 * @description 类型对应的显示文案和图标颜色
 */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; color: string; icon: 'income' | 'withdraw' | 'announcement' | 'activity' | 'commission' | 'recharge' | 'reward' }
> = {
  SYSTEM_ANNOUNCEMENT: { label: '系统公告', color: 'orange', icon: 'announcement' },
  INCOME_RECEIVED: { label: '收益到账', color: 'green', icon: 'income' },
  COMMISSION_RECEIVED: { label: '返佣到账', color: 'cyan', icon: 'commission' },
  RECHARGE_SUCCESS: { label: '充值成功', color: 'green', icon: 'recharge' },
  WITHDRAW_APPROVED: { label: '提现审核通过', color: 'blue', icon: 'withdraw' },
  WITHDRAW_COMPLETED: { label: '提现完成', color: 'green', icon: 'withdraw' },
  WITHDRAW_REJECTED: { label: '提现被拒绝', color: 'red', icon: 'withdraw' },
  WITHDRAW_FAILED: { label: '提现失败', color: 'red', icon: 'withdraw' },
  SIGN_IN_REWARD: { label: '签到奖励', color: 'purple', icon: 'reward' },
  ACTIVITY_REWARD: { label: '活动奖励', color: 'purple', icon: 'activity' },
};

/**
 * 消息类型筛选选项
 */
export const NOTIFICATION_TYPE_OPTIONS = Object.entries(NOTIFICATION_TYPE_CONFIG).map(
  ([value, config]) => ({
    value: value as NotificationType,
    label: config.label,
  })
);

/**
 * 发送对象类型
 */
export type NotificationTargetType = 'ALL' | 'SPECIFIC';

/**
 * 发送对象选项
 */
export const TARGET_TYPE_OPTIONS = [
  { value: 'ALL' as NotificationTargetType, label: '全部用户' },
  { value: 'SPECIFIC' as NotificationTargetType, label: '指定用户' },
];

/**
 * 快捷模板
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
}

/**
 * 快捷模板列表
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'maintenance',
    name: '系统维护通知',
    title: '系统维护公告',
    content: '<p>尊敬的用户，系统将于 <strong>[日期时间]</strong> 进行维护升级，预计持续 <strong>[时长]</strong>，届时将暂停服务。给您带来的不便，敬请谅解！</p>',
  },
  {
    id: 'activity',
    name: '活动开始通知',
    title: '新活动上线',
    content: '<p>尊敬的用户，<strong>[活动名称]</strong> 活动现已开启！参与活动即可获得丰厚奖励，活动时间：<strong>[日期范围]</strong>，不要错过哦！</p>',
  },
  {
    id: 'product_launch',
    name: '新产品上线',
    title: '新产品上线通知',
    content: '<p>尊敬的用户，我们全新推出 <strong>[产品名称]</strong>，收益更高，期限更灵活！立即前往产品页面了解详情，抢先体验！</p>',
  },
  {
    id: 'holiday',
    name: '节日祝福',
    title: '节日快乐',
    content: '<p>尊敬的用户，值此 <strong>[节日名称]</strong> 来临之际，我们全体员工向您致以最诚挚的祝福！祝您节日快乐，阖家幸福！</p>',
  },
];

/**
 * 站内信实体
 */
export interface Notification {
  /** 消息ID */
  id: number;
  /** 接收用户ID（null 表示系统广播） */
  userId: number | null;
  /** 接收用户手机号 */
  userPhone?: string;
  /** 接收用户昵称 */
  userNickname?: string;
  /** 消息类型 */
  type: NotificationType;
  /** 消息标题 */
  title: string;
  /** 消息内容 */
  content: string;
  /** 是否已读 */
  isRead: boolean;
  /** 阅读时间 */
  readAt: string | null;
  /** 发送时间 */
  createdAt: string;
  /** 发送人（管理员用户名） */
  senderName?: string;
}

/**
 * 站内信列表查询参数
 */
export interface NotificationListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 消息类型（支持多选，用逗号分隔） */
  type?: string;
  /** 是否已读 */
  isRead?: boolean;
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
}

/**
 * 发送通知请求参数
 */
export interface SendNotificationParams {
  /** 发送目标类型 */
  targetType: NotificationTargetType;
  /** 目标用户ID列表（targetType=SPECIFIC 时必填） */
  targetUserIds?: number[];
  /** 通知标题 */
  title: string;
  /** 通知内容（富文本） */
  content: string;
}

/**
 * 发送通知响应
 */
export interface SendNotificationResponse {
  /** 发送成功数量 */
  sentCount: number;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  /** 总数 */
  total: number;
  /** 成功数 */
  succeeded: number;
  /** 失败数 */
  failed: number;
  /** 操作结果详情 */
  results: Array<{
    id: number;
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }>;
}
