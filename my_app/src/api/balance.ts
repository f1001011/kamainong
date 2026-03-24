import request from './request'
import type {
  BalanceData,
  MoneyLogItem,
  MoneyLogListData,
  SignInResult,
} from '@/types/balance'

const API_USER_INFO = '/user/info'
const API_MONEY_SUMMARY = '/user/money_summary'
const API_MONEY_LOGS = '/user/money_logs'
const API_SIGN_IN = '/user/sign_in'

const STATUS_TITLE_MAP: Record<number, string> = {
  101: '充值',
  102: '签到',
  103: '每日收益',
  104: '代理返佣',
  105: 'VIP奖励',
  106: '月薪奖励',
  107: '奖池奖励',
  108: '转盘奖励',
  110: '购买商品',
  111: '积分兑换',
  201: '提现',
}

const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const toString = (value: unknown) => String(value || '').trim()

const mapMoneyLog = (raw: any): MoneyLogItem => {
  const status = toNumber(raw.status)
  const amount = toNumber(raw.money)
  const type = toNumber(raw.type) === 2 ? 'expense' : 'income'
  const title = toString(raw.rmark) || STATUS_TITLE_MAP[status] || '资金变动'

  return {
    id: toNumber(raw.id),
    type,
    status,
    moneyType: toNumber(raw.money_type),
    amount,
    moneyBefore: toNumber(raw.money_before),
    moneyEnd: toNumber(raw.money_end),
    title,
    remark: toString(raw.rmark),
    createdAt: toString(raw.create_time),
  }
}

export async function fetchBalanceData(): Promise<BalanceData> {
  const [userInfo, summary, logsResp] = await Promise.all([
    request.get<any>(API_USER_INFO),
    request.get<any>(API_MONEY_SUMMARY),
    request.get<any>(API_MONEY_LOGS, {
      params: { page: 1, page_size: 10, money_type: 1 },
    }),
  ])

  const logsRaw = Array.isArray(logsResp?.list) ? logsResp.list : []
  const logs = logsRaw.map(mapMoneyLog)

  return {
    totalAssets: toNumber(userInfo?.money_balance),
    todayEarnings: toNumber(summary?.today_income),
    availableBalance: toNumber(userInfo?.money_balance),
    frozenAmount: toNumber(userInfo?.money_freeze),
    integral: toNumber(userInfo?.money_integral),
    monthlyIncome: toNumber(summary?.month_income),
    monthlyExpense: toNumber(summary?.month_expense),
    transactions: logs,
  }
}

export async function fetchMoneyLogs(params: {
  page?: number
  pageSize?: number
  moneyType?: 1 | 2
} = {}): Promise<MoneyLogListData> {
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const moneyType = params.moneyType || 1

  const data = await request.get<any>(API_MONEY_LOGS, {
    params: {
      page,
      page_size: pageSize,
      money_type: moneyType,
    },
  })

  const listRaw = Array.isArray(data?.list) ? data.list : []

  return {
    list: listRaw.map(mapMoneyLog),
    page: toNumber(data?.page) || page,
    pageSize: toNumber(data?.page_size) || pageSize,
    total: toNumber(data?.total),
    hasMore: Boolean(data?.has_more),
  }
}

export async function signIn(): Promise<SignInResult> {
  const data = await request.post<any>(API_SIGN_IN)
  return {
    amount: toNumber(data?.amount),
  }
}
