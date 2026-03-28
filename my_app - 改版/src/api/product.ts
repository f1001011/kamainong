import request from './request'
import type { ProductItem } from '@/types/product'

interface FetchProductsParams {
  page?: number
  pageSize?: number
}

interface FetchProductsResult {
  list: ProductItem[]
  hasMore: boolean
}

interface HomeBalanceResult {
  totalAssets: number
}

function toNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeProduct(raw: Record<string, unknown>): ProductItem {
  return {
    id: raw.id ?? '',
    name: String(raw.name ?? raw.goods_name ?? raw.title ?? ''),
    price: toNumber(raw.price ?? raw.goods_money),
    maxPurchase: toNumber(raw.maxPurchase ?? raw.max_purchase ?? raw.purchase_limit ?? raw.stock),
    category: String(raw.category ?? raw.series ?? 'data'),
    iconKey: String(raw.iconKey ?? raw.icon_key ?? raw.icon ?? 'wifi'),
    tag: String(raw.tag ?? raw.label ?? ''),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? raw.cover ?? raw.thumbnail ?? ''),
    dailyIncome: toNumber(raw.dailyIncome ?? raw.day_red ?? raw.daily_income),
    days: toNumber(raw.days ?? raw.period),
    description: String(raw.description ?? raw.goods_desc ?? raw.content ?? ''),
  }
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<FetchProductsResult> {
  const res = await request.get('/products', { params })
  const list = Array.isArray(res?.list)
    ? res.list
    : Array.isArray(res)
      ? res
      : []

  return {
    list: list.map(item => normalizeProduct((item ?? {}) as Record<string, unknown>)),
    hasMore: typeof res?.hasMore === 'boolean'
      ? res.hasMore
      : list.length >= (params.pageSize ?? 10),
  }
}

export async function fetchHomeBalance(): Promise<HomeBalanceResult> {
  const res = await request.get('/user/profile')
  const totalAssets = toNumber(
    res?.totalAssets ??
    (toNumber(res?.availableBalance) + toNumber(res?.frozenBalance))
  )

  return { totalAssets }
}
