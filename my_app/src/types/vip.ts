export interface VipInfo {
  level: number          // 0-9
  currentXp: number
  nextLevelXp: number    // level 9 时为 0
  totalXp: number
}

export interface XpRecord {
  id: string
  sourceKey: string      // recharge | purchase | signin | invite | task
  xp: number
  createdAt: string
}
