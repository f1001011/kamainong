import request from './request'

export interface LotteryPrize {
  id: number
  name: string
  type: number
  amount: number
  image: string
}

export interface LotteryConfigData {
  prizes: LotteryPrize[]
}

export interface LotteryChanceData {
  remaining: number
  todayRemaining: number
}

export interface LotteryHistoryItem {
  id: number
  prizeName: string
  amount: number
  createdAt: string
}

const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const toString = (value: unknown) => String(value || '').trim()

const formatImageUrl = (value: unknown) => {
  const raw = toString(value)
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw
  return `http://kamainong.com/${raw.replace(/^\/+/, '')}`
}

export const getLotteryConfig = async (): Promise<LotteryConfigData> => {
  const data = await request.get<any>('/lottery/config')
  const list = Array.isArray(data?.prizes) ? data.prizes : []
  return {
    prizes: list.map((item: any) => ({
      id: toNumber(item.id),
      name: toString(item.name),
      type: toNumber(item.type),
      amount: toNumber(item.amount),
      image: formatImageUrl(item.image),
    })),
  }
}

export const getLotteryChance = async (): Promise<LotteryChanceData> => {
  const data = await request.get<any>('/lottery/chance')
  return {
    remaining: toNumber(data?.remaining),
    todayRemaining: toNumber(data?.today_remaining),
  }
}

export const spinLottery = async () => {
  const data = await request.post<any>('/lottery/spin')
  const prize = data?.prize || {}
  return {
    id: toNumber(prize.id),
    name: toString(prize.name),
    amount: toNumber(prize.amount),
    type: toNumber(prize.type),
  }
}

export const getLotteryHistory = async (): Promise<LotteryHistoryItem[]> => {
  const data = await request.get<any>('/lottery/history')
  const list = Array.isArray(data?.list) ? data.list : []
  return list.map((item: any) => ({
    id: toNumber(item.id),
    prizeName: toString(item.prize_name),
    amount: toNumber(item.amount),
    createdAt: toString(item.create_time),
  }))
}
