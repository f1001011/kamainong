import request from './request'
import type { ApiResponse, BalanceData } from '@/types/balance'

// ── 接口路由（后续直接在此修改）──────────────────────────────────────────────
const API_BALANCE_OVERVIEW = '/balance/overview'

// ── Mock 数据（接口就绪后删除此块）───────────────────────────────────────────
const MOCK: BalanceData = {
  totalAssets:      128450.88,
  todayEarnings:    2341.50,
  availableBalance: 123450.88,
  frozenAmount:     5000.00,
  monthlyIncome:    32100,
  monthlyExpense:   18650,
  transactions: [
    { id: 1, category: 'wechat',  type: 'income',  amount: 3200.00,  createdAt: '2026-02-25T13:43:00Z' },
    { id: 2, category: 'meituan', type: 'expense', amount: 68.50,    createdAt: '2026-02-25T12:58:00Z' },
    { id: 3, category: 'salary',  type: 'income',  amount: 18000.00, createdAt: '2026-02-24T09:00:00Z' },
    { id: 4, category: 'didi',    type: 'expense', amount: 45.20,    createdAt: '2026-02-24T18:30:00Z' },
    { id: 5, category: 'coffee',  type: 'expense', amount: 38.00,    createdAt: '2026-02-23T10:15:00Z' },
  ],
}

// ── 获取余额中心数据 ───────────────────────────────────────────────────────────
export async function fetchBalanceData(): Promise<BalanceData> {
  // 接口就绪后：删除 mock 块，取消下面一行注释即可
  // 注：拦截器已处理 token / code / message，此处直接拿到 BalanceData
  // return request.get<BalanceData>(API_BALANCE_OVERVIEW)

  return new Promise(resolve => setTimeout(() => resolve(MOCK), 400))
}
