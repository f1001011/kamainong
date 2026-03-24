export type TxType = 'income' | 'expense'

export interface MoneyLogItem {
  id: number
  type: TxType
  status: number
  moneyType: number
  amount: number
  moneyBefore: number
  moneyEnd: number
  title: string
  remark: string
  createdAt: string
}

export interface BalanceData {
  totalAssets: number
  todayEarnings: number
  availableBalance: number
  frozenAmount: number
  integral: number
  monthlyIncome: number
  monthlyExpense: number
  transactions: MoneyLogItem[]
}

export interface MoneyLogListData {
  list: MoneyLogItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface SignInResult {
  amount: number
}
