export interface CategoryItem {
  key: string
  labelZh: string
  labelEn: string
  iconKey: string
  colorKey: string
}

export interface ProductItem {
  id: number
  category: string
  name: string
  price: number
  maxPurchase: number
  tag: string
  iconKey: string
  imageUrl?: string
  dailyIncome: number
  totalIncome: number
  cycle: number
  status: number
}

export interface ProductDetailData extends ProductItem {
  dailyRate: number
}

export interface ProductListData {
  list: ProductItem[]
  total: number
  hasMore: boolean
}

export interface ProductListParams {
  page: number
  pageSize: number
  category?: string
}

export interface HomeBalanceData {
  totalAssets: number
}
