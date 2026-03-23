import request from './request'
import type { VipInfo, XpRecord } from '@/types/vip'

// ── 模拟数据 ──────────────────────────────────────────────────────────────────
const MOCK_SOURCES: XpRecord['sourceKey'][] = ['recharge', 'purchase', 'signin', 'invite', 'task']
const MOCK_XP = { recharge: 50, purchase: 15, signin: 5, invite: 100, task: 30 }

function mockXpList(page: number, pageSize: number) {
  const total = 38
  const start = (page - 1) * pageSize
  const list: XpRecord[] = Array.from({ length: Math.min(pageSize, total - start) }, (_, i) => {
    const src = MOCK_SOURCES[(start + i) % MOCK_SOURCES.length]
    const hoursAgo = (start + i + 1) * 3
    return {
      id: `xp_${start + i}`,
      sourceKey: src,
      xp: MOCK_XP[src] + Math.floor(Math.random() * 10),
      createdAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
    }
  })
  return { list, hasMore: start + pageSize < total, total }
}

// ── 真实接口（后续替换）────────────────────────────────────────────────────────
export const fetchVipInfo = (): Promise<VipInfo> =>
  new Promise(resolve =>
    setTimeout(() =>
      resolve({ level: 5, currentXp: 3200, nextLevelXp: 5000, totalXp: 18200 }), 300)
  )

export const fetchVipXpHistory = (params: { page: number; pageSize: number }) =>
  new Promise<{ list: XpRecord[]; hasMore: boolean; total: number }>(resolve =>
    setTimeout(() => resolve(mockXpList(params.page, params.pageSize)), 280)
  )
