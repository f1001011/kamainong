// ── 交易分类 ────────────────────────────────────────────────────────────────
export type TxCategory =
  | 'wechat'
  | 'meituan'
  | 'salary'
  | 'didi'
  | 'coffee'
  | string   // 兼容后续扩展

export type TxType = 'income' | 'expense'

// ── 单条交易 ─────────────────────────────────────────────────────────────────
export interface Transaction {
  id: number
  category: TxCategory      // 前端据此映射图标/颜色
  type: TxType
  amount: number            // 原始数值，前端自行格式化
  createdAt: string         // ISO 8601，如 "2026-02-25T13:45:00Z"
}

// ── 余额中心接口响应 ──────────────────────────────────────────────────────────
export interface BalanceData {
  totalAssets: number       // 总资产
  todayEarnings: number     // 今日收益（正数=收入，负数=支出）
  availableBalance: number  // 可用余额
  frozenAmount: number      // 冻结金额
  monthlyIncome: number     // 本月收入
  monthlyExpense: number    // 本月支出
  transactions: Transaction[]
}

// ── 接口通用包装 ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
