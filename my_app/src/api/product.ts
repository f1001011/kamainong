import request from './request'
import type {
  CategoryItem,
  ProductItem,
  ProductDetailData,
  ProductListData,
  ProductListParams,
  HomeBalanceData,
} from '@/types/product'

const API_PRODUCT_LIST = '/product/list'
const API_PRODUCT_DETAIL = '/product/detail'
const API_HOME_BALANCE = '/user/balance'

const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const formatImageUrl = (value: unknown) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw
  return `http://kamainong.com/${raw.replace(/^\/+/, '')}`
}

const mapProduct = (raw: any): ProductItem => {
  const price = toNumber(raw.goods_money)
  const buyNum = toNumber(raw.buy_num)

  return {
    id: toNumber(raw.id),
    category: 'data',
    name: raw.goods_name || '',
    price,
    maxPurchase: buyNum > 0 ? buyNum : 9999,
    tag: toNumber(raw.status) === 2 ? '即将推出' : '',
    iconKey: 'wifi',
    imageUrl: formatImageUrl(raw.head_img),
    dailyIncome: toNumber(raw.day_red || raw.income_per_time),
    totalIncome: toNumber(raw.total_money),
    cycle: toNumber(raw.period),
    status: toNumber(raw.status),
  }
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  return []
}

export async function fetchProducts(params: ProductListParams): Promise<ProductListData> {
  const rows = await request.get<any[]>(API_PRODUCT_LIST, {
    params: {
      category: params.category || '',
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  const all = Array.isArray(rows) ? rows.map(mapProduct) : []
  const start = (params.page - 1) * params.pageSize
  const list = all.slice(start, start + params.pageSize)

  return {
    list,
    total: all.length,
    hasMore: start + params.pageSize < all.length,
  }
}

export async function fetchHomeBalance(): Promise<HomeBalanceData> {
  const data = await request.get<{ balance?: number }>(API_HOME_BALANCE)
  return { totalAssets: toNumber(data?.balance) }
}

export async function getProductDetail(id: number): Promise<ProductDetailData> {
  const raw = await request.get<any>(API_PRODUCT_DETAIL, { params: { id } })
  const product = mapProduct(raw || {})
  const dailyRate = toNumber(raw?.revenue_lv) || (product.price > 0 ? Number(((product.dailyIncome / product.price) * 100).toFixed(2)) : 0)
  return {
    ...product,
    dailyRate,
  }
}
