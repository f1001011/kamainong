// ── 分类 ──────────────────────────────────────────────────────────────────────
export interface CategoryItem {
  key: string       // 'all' | 'data' | 'phone' | 'member' | 'game' | 'life'
  labelZh: string
  labelEn: string
  iconKey: string   // 前端据此映射 lucide 图标
  colorKey: string  // 'red' | 'cyan' | 'amber' | 'green'
}

// ── 商品 ──────────────────────────────────────────────────────────────────────
export interface ProductItem {
  id: number
  category: string
  name: string
  price: number
  maxPurchase: number
  tag: string       // '热门' | '推荐' | '爆款' | '超值' | '精选' | ''
  iconKey: string   // 前端据此映射 lucide 图标
  imageUrl?: string // 商品图片，有则优先展示
}

// ── Banner ────────────────────────────────────────────────────────────────────
export interface BannerItem {
  id: number
  tag: string
  title: string
  sub: string
  gradient: string
  glow: string
  iconKey: string   // 无图片时的备用图标
  imageUrl?: string // Banner 图片，有则覆盖渐变背景
}

// ── 分页响应 ──────────────────────────────────────────────────────────────────
export interface ProductListData {
  list: ProductItem[]
  total: number
  hasMore: boolean
}

// ── 请求参数 ──────────────────────────────────────────────────────────────────
export interface ProductListParams {
  category: string  // 'all' 或具体分类 key
  page: number
  pageSize: number
}

// ── 首页余额快览（轻量版，不含交易记录）──────────────────────────────────────
export interface HomeBalanceData {
  totalAssets: number
}
