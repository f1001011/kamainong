export interface ProductItem {
  id: number | string
  name: string
  price: number
  maxPurchase: number
  category: string
  iconKey: string
  tag: string
  imageUrl: string
  dailyIncome?: number
  days?: number
  description?: string
}
