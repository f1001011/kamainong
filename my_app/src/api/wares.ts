import request from './request'

export interface WaresItem {
  id: number
  name: string
  price: number
  spec: string
  imageUrl: string
  content: string
}

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

const mapWares = (raw: any): WaresItem => ({
  id: toNumber(raw.id),
  name: raw.wares_name || '',
  price: toNumber(raw.wares_money),
  spec: raw.wares_spec || '',
  imageUrl: formatImageUrl(raw.head_img),
  content: raw.content || '',
})

export const fetchWaresList = async () => {
  const rows = await request.get<any[]>('/wares/list')
  return Array.isArray(rows) ? rows.map(mapWares) : []
}
