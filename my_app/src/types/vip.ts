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
