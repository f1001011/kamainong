import {
  SPORTS_IFRAME_URL,
  gameSections,
  homeBanners,
  homeQuickGallery,
  homeSections,
  profileMenuItems,
  rechargeTips,
  recordMockMap,
  sportsHighlights,
} from '@/config/worldCup'

export async function fetchHomeContent() {
  return {
    banners: homeBanners,
    quickGallery: homeQuickGallery,
    sections: homeSections,
  }
}

export async function fetchGamesContent() {
  return {
    sections: gameSections,
  }
}

export async function fetchSportsShell() {
  return {
    iframeUrl: SPORTS_IFRAME_URL,
    highlights: sportsHighlights,
  }
}

export async function fetchProfileContent() {
  return {
    menuItems: profileMenuItems,
    rechargeNotes: rechargeTips,
  }
}

export async function fetchRecordPages(type: string) {
  return recordMockMap[type] ?? []
}

export function getRecordTitle(type: string) {
  const titleMap: Record<string, string> = {
    recharge: '我的充值历史',
    withdraw: '我的提现历史',
    bet: '我的下注历史',
  }

  return titleMap[type] ?? '历史记录'
}
