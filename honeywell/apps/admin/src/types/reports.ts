/**
 * @file 报表模块类型定义
 * @description 财务报表、用户报表、产品报表、返佣报表的数据类型
 * @depends 开发文档/04-后台管理端/04.2-数据报表/
 */

// ================= 通用类型 =================

/**
 * 日期范围查询参数
 */
export interface DateRangeParams {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  [key: string]: unknown; // 添加索引签名以兼容 Record<string, unknown>
}

/**
 * 快捷日期范围选项
 */
export type QuickDateRange = 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last30days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'custom';

/**
 * 趋势变化
 */
export interface TrendChange {
  value: number;           // 变化百分比
  trend: 'up' | 'down' | 'flat';
  text: string;            // 显示文本，如 "+15.5%"
}

// ================= 财务报表 =================

/**
 * 财务报表汇总数据
 * @description 依据：04.2.1-财务报表页.md 第四、五节
 */
export interface FinancialSummary {
  // 核心指标
  netInflow: string;           // 净入金 = (充值 - 代收手续费) - (提现 + 代付手续费)
  rechargeAmount: string;      // 充值总额（原始金额）
  rechargeCount: number;       // 充值笔数
  rechargeSuccessRate: string; // 充值成功率
  channelPayFee: string;       // 通道代收手续费
  withdrawAmount: string;      // 提现总额（原始金额）
  withdrawCount: number;       // 提现笔数
  withdrawFee: string;         // 提现手续费收入（向用户收取的）
  channelTransferFee: string;  // 通道代付手续费
  theoreticalProfit: string;   // 理论利润

  // 支出明细
  incomeAmount: string;        // 收益发放
  commissionAmount: string;    // 返佣发放
  signInRewardAmount: string;  // 签到奖励
  activityRewardAmount: string;// 活动奖励
  registerBonusAmount: string; // 注册奖励
  totalExpense: string;        // 支出小计（不含通道代付手续费，因已计入净入金）
}

/**
 * 财务日报数据
 */
export interface FinancialDailyData {
  date: string;               // YYYY-MM-DD
  rechargeAmount: string;
  rechargeCount: number;
  withdrawAmount: string;
  withdrawCount: number;
  netInflow: string;
}

/**
 * 财务报表响应
 */
export interface FinancialReportResponse {
  summary: FinancialSummary;
  daily: FinancialDailyData[];
}

// ================= 用户报表 =================

/**
 * 用户报表汇总数据
 * @description 依据：04.2.2-用户报表页.md 第四节
 */
export interface UserSummary {
  newUsers: number;            // 新增用户
  activeUsers: number;         // 活跃用户
  paidUsers: number;           // 付费用户
  newPaidUsers: number;        // 新增付费用户
  conversionRate: string;      // 付费转化率
  rechargeUsers: number;       // 充值用户
  withdrawUsers: number;       // 提现用户
  avgRechargePerUser: string;  // 人均充值
}

/**
 * VIP等级分布
 */
export interface VipDistributionItem {
  level: number;               // VIP等级 0-5
  count: number;               // 用户数量
}

/**
 * 用户日报数据
 */
export interface UserDailyData {
  date: string;
  newUsers: number;
  activeUsers: number;
  paidUsers: number;
}

/**
 * 用户报表响应
 */
export interface UserReportResponse {
  summary: UserSummary;
  vipDistribution: VipDistributionItem[];
  daily: UserDailyData[];
}

// ================= 产品报表 =================

/**
 * 产品报表汇总数据
 * @description 依据：04.2.3-产品报表页.md 第四节
 */
export interface ProductSummary {
  totalSalesCount: number;     // 总销量
  totalSalesAmount: string;    // 总销售额
  poSalesAmount: string;       // Po系列销售额
  vipSalesAmount: string;      // VIP系列销售额
}

/**
 * 产品销售明细
 */
export interface ProductSalesItem {
  productId: number;
  productName: string;
  productSeries: 'PO' | 'VIP';
  salesCount: number;          // 销量
  salesAmount: string;         // 销售额
  salesPercent: string;        // 占比百分比
  purchaseUsers: number;       // 购买用户数
  activeOrders: number;        // 进行中订单数
  pendingIncome: string;       // 待发放收益
}

/**
 * 产品报表请求参数
 */
export interface ProductReportParams extends DateRangeParams {
  series?: 'PO' | 'VIP';       // 产品系列筛选
}

/**
 * 产品报表响应
 */
export interface ProductReportResponse {
  list: ProductSalesItem[];
  summary: ProductSummary;
}

// ================= 返佣报表 =================

/**
 * 返佣报表汇总数据
 * @description 依据：04.2.4-返佣报表页.md 第四、五节
 */
export interface CommissionSummary {
  totalAmount: string;         // 返佣总额
  level1Amount: string;        // 一级返佣
  level2Amount: string;        // 二级返佣
  level3Amount: string;        // 三级返佣
  triggerOrderCount: number;   // 触发订单数
  receiverCount: number;       // 获佣用户数
}

/**
 * 返佣日报数据
 */
export interface CommissionDailyData {
  date: string;
  totalAmount: string;
  level1Amount: string;
  level2Amount: string;
  level3Amount: string;
}

/**
 * 返佣报表响应
 */
export interface CommissionReportResponse {
  summary: CommissionSummary;
  daily: CommissionDailyData[];
}

/**
 * 获佣用户排行
 */
export interface TopReceiverItem {
  userId: number;
  userPhone: string;
  nickname: string;
  totalAmount: string;
}

/**
 * 返佣统计响应（含排行）
 */
export interface CommissionStatsResponse {
  summary: CommissionSummary;
  topReceivers: TopReceiverItem[];
  dailyTrend: Array<{
    date: string;
    amount: string;
    count: number;
  }>;
}

/**
 * 返佣级别枚举
 */
export type CommissionLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

/**
 * 返佣明细查询参数
 */
export interface CommissionListParams extends DateRangeParams {
  page: number;
  pageSize: number;
  level?: CommissionLevel;
}

/**
 * 返佣明细记录
 */
export interface CommissionRecord {
  id: number;
  receiverId: number;
  receiverPhone: string;
  receiverNickname: string;
  sourceUserId: number;
  sourceUserPhone: string;
  sourceUserNickname: string;
  level: CommissionLevel;
  rate: string;
  baseAmount: string;
  amount: string;
  productId: number;
  productName: string;
  positionOrderNo: string;
  createdAt: string;
}

/**
 * 返佣明细响应
 */
export interface CommissionListResponse {
  list: CommissionRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ================= 导出配置 =================

/**
 * Excel导出列配置
 */
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  date: string;
  type: string;
  value: number;
}
