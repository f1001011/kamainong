import request from './request'

export interface VipInfo {
  level: number
  label: string
  totalBuyCount: number
  currentBuyCount: number
  nextBuyCount: number
  nextNeed: number
  rewardMoney: number
}

export interface BuyRecord {
  id: number
  name: string
  amount: number
  createdAt: string
}

const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export const fetchVipInfo = async (): Promise<VipInfo> => {
  const raw = await request.get<any>('/vip/config')
  return {
    level: toNumber(raw?.level),
    label: raw?.label || 'LV0',
    totalBuyCount: toNumber(raw?.total_buy_count),
    currentBuyCount: toNumber(raw?.current_buy_count),
    nextBuyCount: toNumber(raw?.next_buy_count),
    nextNeed: toNumber(raw?.next_need),
    rewardMoney: toNumber(raw?.reward_money),
  }
}

export const fetchVipBuyLog = async (): Promise<BuyRecord[]> => {
  const rows = await request.get<any[]>('/vip/buy_log')
  if (!Array.isArray(rows)) return []
  return rows.map(item => ({
    id: toNumber(item.id),
    name: item.goods_name || '',
    amount: toNumber(item.goods_money),
    createdAt: item.create_time || '',
  }))
}
