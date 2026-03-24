/**
 * @file 登录日志类型定义
 * @description 管理员登录日志、用户登录日志的类型定义
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.3-管理员登录日志页.md
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.4-用户登录日志页.md
 */

// ==================== 管理员登录日志 ====================

/**
 * 管理员登录日志项
 * @description 依据：04.10.3-管理员登录日志页.md 第3.2节
 */
export interface AdminLoginLogItem {
  /** 日志ID */
  id: number;
  /** 管理员ID（登录失败时可能为空） */
  adminId: number | null;
  /** 尝试登录的用户名 */
  username: string;
  /** 登录IP地址 */
  ip: string;
  /** IP归属地 */
  ipLocation: string | null;
  /** 浏览器User-Agent */
  userAgent: string | null;
  /** 解析后的设备信息 */
  deviceInfo: string | null;
  /** 登录状态 */
  status: 'SUCCESS' | 'FAILED';
  /** 失败原因 */
  failReason: string | null;
  /** 登录时间 */
  createdAt: string;
  /** 频繁失败标记（后端计算） */
  isFrequentFail?: boolean;
  /** 异常位置标记（后端计算） */
  isAnomalousLocation?: boolean;
}

/**
 * 管理员登录日志统计
 */
export interface AdminLoginLogStatistics {
  /** 今日登录总次数 */
  todayTotal: number;
  /** 今日活跃管理员数（去重） */
  todayAdmins: number;
  /** 今日登录失败次数 */
  todayFailed: number;
  /** 今日登录失败率（百分比） */
  todayFailRate: string;
}

/**
 * 管理员登录日志查询参数
 */
export interface AdminLoginLogQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 管理员ID */
  adminId?: number;
  /** 用户名（模糊搜索） */
  username?: string;
  /** IP地址（模糊搜索） */
  ip?: string;
  /** 登录状态 */
  status?: 'SUCCESS' | 'FAILED';
  /** 开始日期 YYYY-MM-DD */
  startDate?: string;
  /** 结束日期 YYYY-MM-DD */
  endDate?: string;
}

/**
 * 管理员登录日志列表响应
 */
export interface AdminLoginLogListResponse {
  list: AdminLoginLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  statistics: AdminLoginLogStatistics;
}

// ==================== 用户登录日志 ====================

/**
 * 用户登录日志项
 * @description 依据：04.10.4-用户登录日志页.md 第3.2节
 */
export interface UserLoginLogItem {
  /** 日志ID */
  id: number;
  /** 用户ID（登录失败时可能为空） */
  userId: number | null;
  /** 尝试登录的手机号 */
  phone: string;
  /** 登录IP地址 */
  ip: string;
  /** IP归属地 */
  ipLocation: string | null;
  /** 浏览器User-Agent */
  userAgent: string | null;
  /** 设备类型 */
  deviceType: 'mobile' | 'desktop' | 'tablet' | null;
  /** 登录是否成功 */
  success: boolean;
  /** 失败原因 */
  failReason: string | null;
  /** 登录时间 */
  createdAt: string;
  /** 用户关联信息（用于 UserInfoCard 展示） */
  user?: {
    id: number;
    phone: string;
    nickname: string | null;
    avatarUrl: string | null;
    vipLevel: number;
    status: 'ACTIVE' | 'BANNED';
  } | null;
}

/**
 * 用户登录日志统计
 */
export interface UserLoginLogStatistics {
  /** 今日登录总次数 */
  todayTotal: number;
  /** 今日登录用户数（去重） */
  todayUsers: number;
  /** 今日登录失败次数 */
  todayFailed: number;
  /** 今日登录失败率（百分比） */
  todayFailRate: string;
}

/**
 * 用户登录日志查询参数
 */
export interface UserLoginLogQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 用户ID */
  userId?: number;
  /** 手机号（模糊搜索） */
  phone?: string;
  /** IP地址（模糊搜索） */
  ip?: string;
  /** 登录是否成功 */
  success?: boolean;
  /** 设备类型 */
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  /** 开始日期 YYYY-MM-DD */
  startDate?: string;
  /** 结束日期 YYYY-MM-DD */
  endDate?: string;
}

/**
 * 用户登录日志列表响应
 */
export interface UserLoginLogListResponse {
  list: UserLoginLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  statistics: UserLoginLogStatistics;
}

// ==================== 操作日志 ====================

/**
 * 操作模块枚举
 * @description 依据：04.10.5-操作日志页.md 第3.1节
 */
export const MODULE_OPTIONS = [
  { value: 'USER', label: '用户管理', color: 'blue' },
  { value: 'RECHARGE', label: '充值管理', color: 'green' },
  { value: 'WITHDRAW', label: '提现管理', color: 'orange' },
  { value: 'PRODUCT', label: '产品管理', color: 'purple' },
  { value: 'ACTIVITY', label: '活动管理', color: 'magenta' },
  { value: 'CONTENT', label: '内容管理', color: 'cyan' },
  { value: 'CONFIG', label: '系统配置', color: 'gold' },
  { value: 'ADMIN', label: '管理员', color: 'red' },
  { value: 'CHANNEL', label: '支付通道', color: 'lime' },
  { value: 'BLACKLIST', label: '黑名单', color: 'volcano' },
  { value: 'INCOME', label: '收益管理', color: 'geekblue' },
  { value: 'TEXT', label: '文案配置', color: 'default' },
] as const;

/**
 * 操作类型枚举
 * @description 依据：04.10.5-操作日志页.md 第3.2节
 */
export const ACTION_OPTIONS = [
  { value: 'CREATE', label: '新增' },
  { value: 'UPDATE', label: '编辑' },
  { value: 'DELETE', label: '删除' },
  { value: 'BAN', label: '封禁' },
  { value: 'UNBAN', label: '解封' },
  { value: 'APPROVE', label: '审核通过' },
  { value: 'REJECT', label: '审核拒绝' },
  { value: 'BALANCE_ADD', label: '增加余额' },
  { value: 'BALANCE_DEDUCT', label: '扣减余额' },
  { value: 'GIFT_PRODUCT', label: '赠送产品' },
  { value: 'RESET_PASSWORD', label: '重置密码' },
  { value: 'VIP_CHANGE', label: '修改等级' },
  { value: 'RESTORE_PURCHASE', label: '恢复限购' },
  { value: 'STATUS_CHANGE', label: '状态变更' },
  { value: 'TOGGLE', label: '开关切换' },
  { value: 'RETRY', label: '重试' },
  { value: 'MARK_HANDLED', label: '标记处理' },
  { value: 'BATCH_APPROVE', label: '批量通过' },
  { value: 'BATCH_REJECT', label: '批量拒绝' },
  { value: 'BATCH_BAN', label: '批量封禁' },
  { value: 'BATCH_UNBAN', label: '批量解封' },
  { value: 'BATCH_RETRY', label: '批量补发' },
  { value: 'IMPORT', label: '导入' },
  { value: 'EXPORT', label: '导出' },
] as const;

/**
 * 对象类型枚举
 * @description 依据：04.10.5-操作日志页.md 第3.3节
 */
export const TARGET_TYPE_OPTIONS = [
  { value: 'User', label: '用户' },
  { value: 'Admin', label: '管理员' },
  { value: 'Product', label: '产品' },
  { value: 'RechargeOrder', label: '充值订单' },
  { value: 'WithdrawOrder', label: '提现订单' },
  { value: 'PositionOrder', label: '持仓订单' },
  { value: 'IncomeRecord', label: '收益记录' },
  { value: 'Banner', label: 'Banner' },
  { value: 'Announcement', label: '公告' },
  { value: 'Activity', label: '活动' },
  { value: 'PaymentChannel', label: '支付通道' },
  { value: 'GlobalConfig', label: '全局配置' },
  { value: 'TextConfig', label: '文案配置' },
  { value: 'Blacklist', label: '黑名单' },
  { value: 'SensitiveWord', label: '敏感词' },
  { value: 'Bank', label: '银行' },
  { value: 'PageConfig', label: '页面配置' },
] as const;

/**
 * 操作日志项
 * @description 依据：04.10.5-操作日志页.md 第6节
 */
export interface OperationLogItem {
  /** 日志ID */
  id: number;
  /** 管理员ID */
  adminId: number;
  /** 管理员名称 */
  adminName: string;
  /** 操作模块 */
  module: string;
  /** 操作类型 */
  action: string;
  /** 对象类型 */
  targetType: string | null;
  /** 对象ID */
  targetId: string | null;
  /** 操作前数据（JSON） */
  beforeData: Record<string, unknown> | null;
  /** 操作后数据（JSON） */
  afterData: Record<string, unknown> | null;
  /** 操作IP */
  ip: string | null;
  /** 操作备注 */
  remark: string | null;
  /** 操作时间 */
  createdAt: string;
}

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 管理员ID */
  adminId?: number;
  /** 操作模块 */
  module?: string;
  /** 操作类型 */
  action?: string;
  /** 对象类型 */
  targetType?: string;
  /** 对象ID */
  targetId?: string;
  /** 开始日期 YYYY-MM-DD */
  startDate?: string;
  /** 结束日期 YYYY-MM-DD */
  endDate?: string;
  /** IP地址 */
  ip?: string;
}

/**
 * 操作日志列表响应
 */
export interface OperationLogListResponse {
  list: OperationLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ==================== 导出相关 ====================

/**
 * 登录日志导出参数
 */
export interface LoginLogExportParams {
  /** 筛选条件 */
  filters: Record<string, unknown>;
  /** 导出格式 */
  format: 'xlsx' | 'csv';
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
}
