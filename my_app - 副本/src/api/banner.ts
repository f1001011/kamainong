import request from './request'

export interface BannerItem {
  id: number | string
  tag: string
  title: string
  subtitle: string
  image_url: string
  bg_color: string
  link_url: string
}

interface BannerListResult {
  list: BannerItem[]
}

function normalizeBanner(raw: Record<string, unknown>): BannerItem {
  return {
    id: raw.id ?? '',
    tag: String(raw.tag ?? raw.label ?? ''),
    title: String(raw.title ?? raw.name ?? ''),
    subtitle: String(raw.subtitle ?? raw.description ?? ''),
    image_url: String(raw.image_url ?? raw.imageUrl ?? raw.cover ?? ''),
    bg_color: String(raw.bg_color ?? raw.bgColor ?? ''),
    link_url: String(raw.link_url ?? raw.linkUrl ?? ''),
  }
}

export async function getBannerList(): Promise<BannerListResult> {
  const res = await request.get('/banners')
  const list = Array.isArray(res?.list)
    ? res.list
    : Array.isArray(res)
      ? res
      : []

  return {
    list: list.map(item => normalizeBanner((item ?? {}) as Record<string, unknown>)),
  }
}
