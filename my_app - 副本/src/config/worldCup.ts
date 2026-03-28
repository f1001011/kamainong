export interface BannerItem {
  id: string
  title: string
  subtitle: string
  tag: string
  imageUrl: string
}

export interface ImageCardItem {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  badge?: string
}

export interface HomeSection {
  id: string
  title: string
  subtitle: string
  cards: ImageCardItem[]
}

export interface GameSection {
  id: string
  title: string
  description: string
  accent: string
  heroImage: string
  cards: ImageCardItem[]
}

export interface RecordItem {
  id: string
  title: string
  amount: string
  status: string
  time: string
}

export const SPORTS_IFRAME_URL = ''

export const homeBanners: BannerItem[] = [
  {
    id: 'banner-1',
    title: '世界波之夜',
    subtitle: '锁定焦点大战、球星海报与球迷狂欢，先把世界杯氛围拉满。',
    tag: '焦点海报',
    imageUrl: 'https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner-2',
    title: '金杯巡礼',
    subtitle: '冠军奖杯、球场灯光与入场仪式，用沉浸式横幅强化赛事记忆点。',
    tag: '冠军时刻',
    imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner-3',
    title: '球迷主场',
    subtitle: '用大图与卡片化内容承接主视觉，突出观赛氛围与热点内容。',
    tag: '热区推荐',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner-4',
    title: '经典对决',
    subtitle: '把传奇比赛瞬间、热门球队和专题内容统一到一个移动端节奏中。',
    tag: '经典比赛',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  },
]

export const homeQuickGallery: ImageCardItem[] = [
  { id: 'quick-1', title: '揭幕战', subtitle: '球场灯光', imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80', badge: 'LIVE' },
  { id: 'quick-2', title: '冠军杯', subtitle: '金杯陈列', imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500&q=80', badge: 'TOP' },
  { id: 'quick-3', title: '球迷墙', subtitle: '看台热浪', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80', badge: 'HOT' },
  { id: 'quick-4', title: '决赛夜', subtitle: '夜场对决', imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=500&q=80', badge: 'NEW' },
  { id: 'quick-5', title: '边线镜头', subtitle: '教练席', imageUrl: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=500&q=80', badge: '专题' },
  { id: 'quick-6', title: '训练营', subtitle: '赛前热身', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80', badge: '热身' },
  { id: 'quick-7', title: '战术板', subtitle: '阵型解析', imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80', badge: '战术' },
  { id: 'quick-8', title: '荣耀时刻', subtitle: '全场欢呼', imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=500&q=80', badge: '精选' },
]

export const homeSections: HomeSection[] = [
  {
    id: 'hot-matches',
    title: '热门赛事',
    subtitle: '大图卡片优先传递赛事气氛，用简洁中文文案替代旧投资信息。',
    cards: [
      { id: 'match-1', title: 'A组头名争夺', subtitle: '今晚 20:00 · 球场之夜', imageUrl: 'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=800&q=80', badge: '焦点' },
      { id: 'match-2', title: '四强卡位战', subtitle: '明晚 22:00 · 决胜阶段', imageUrl: 'https://images.unsplash.com/photo-1606925797303-43b0a037d5c4?auto=format&fit=crop&w=800&q=80', badge: '热议' },
      { id: 'match-3', title: '传奇宿敌再会', subtitle: '后天 03:00 · 经典重逢', imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=800&q=80', badge: '经典' },
      { id: 'match-4', title: '冠军热门观察', subtitle: '专题内容 · 球队走势', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80', badge: '专题' },
    ],
  },
  {
    id: 'team-gallery',
    title: '球队图鉴',
    subtitle: '以海报感封面呈现球队风格、颜色和标签，强化世界杯栏目识别度。',
    cards: [
      { id: 'team-1', title: '桑巴节奏', subtitle: '速度与创造力', imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80', badge: '南美' },
      { id: 'team-2', title: '蓝白星辉', subtitle: '控场与终结', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80', badge: '冠军相' },
      { id: 'team-3', title: '红色铁壁', subtitle: '纪律与压迫', imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=800&q=80', badge: '硬仗' },
      { id: 'team-4', title: '橙色风暴', subtitle: '边路与转移', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', badge: '强队' },
    ],
  },
  {
    id: 'moments',
    title: '世界杯瞬间',
    subtitle: '用图片墙快速铺满内容密度，提升首页的移动端浏览节奏。',
    cards: [
      { id: 'moment-1', title: '点球一击', subtitle: '全场静止的瞬间', imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80' },
      { id: 'moment-2', title: '高举双臂', subtitle: '看台与草地同频沸腾', imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80' },
      { id: 'moment-3', title: '边线冲刺', subtitle: '速度与身体对抗', imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80' },
      { id: 'moment-4', title: '捧杯合影', subtitle: '决赛夜最亮的镜头', imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=80' },
    ],
  },
]

export const gameSections: GameSection[] = [
  {
    id: 'guess-zone',
    title: '竞猜专区',
    description: '以静态专题卡片承接竞猜气氛，先建立频道样式和层次。',
    accent: '赛前热点',
    heroImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    cards: [
      { id: 'guess-1', title: '胜负趋势', subtitle: '主场热度与走势海报', imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80', badge: '热门' },
      { id: 'guess-2', title: '射手时刻', subtitle: '明星球员专题封面', imageUrl: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=800&q=80', badge: '前锋' },
      { id: 'guess-3', title: '战术拆解', subtitle: '阵型与攻防亮点', imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80', badge: '分析' },
    ],
  },
  {
    id: 'top-duels',
    title: '热门对决',
    description: '与首页推荐流不同，这里偏专题陈列和对决感海报。',
    accent: '专题陈列',
    heroImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    cards: [
      { id: 'duel-1', title: '速度对撞', subtitle: '双边锋火力全开', imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80', badge: '强强' },
      { id: 'duel-2', title: '中场控制战', subtitle: '节奏与压迫的较量', imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=800&q=80', badge: '中场' },
      { id: 'duel-3', title: '防线铁闸', subtitle: '零封主题视觉', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', badge: '防守' },
    ],
  },
  {
    id: 'legends',
    title: '传奇球星',
    description: '保留陈列感和故事感，用一屏一组的方式做视觉分层。',
    accent: '传奇海报',
    heroImage: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
    cards: [
      { id: 'legend-1', title: '十号位灵感', subtitle: '创造与终结并存', imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80', badge: '大师' },
      { id: 'legend-2', title: '禁区猎手', subtitle: '门前一击定胜负', imageUrl: 'https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=800&q=80', badge: '王牌' },
      { id: 'legend-3', title: '后防统帅', subtitle: '领袖气质海报', imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80', badge: '核心' },
    ],
  },
]

export const sportsHighlights = [
  '固定头部 + 自适应 iframe 容器',
  '空地址时展示友好提示',
  '后续仅替换配置常量即可接入正式页面',
]

export const profileMenuItems = [
  { title: '充值', desc: '展示二维码与中文说明', path: '/recharge' },
  { title: '提现', desc: '保留字母数字输入与提交按钮', path: '/withdraw' },
  { title: '我的充值历史', desc: '滚动到底加载第 2 页 mock 数据', path: '/records/recharge' },
  { title: '我的提现历史', desc: '沿用统一记录页组件', path: '/records/withdraw' },
  { title: '我的下注历史', desc: '继续世界杯主题视觉样式', path: '/records/bet' },
]

export const recordMockMap: Record<string, RecordItem[][]> = {
  recharge: [
    [
      { id: 'rc-001', title: '世界杯钱包充值', amount: '+ 1,000 XAF', status: '已到账', time: '2026-03-25 09:20' },
      { id: 'rc-002', title: '球迷通道充值', amount: '+ 2,400 XAF', status: '处理中', time: '2026-03-24 18:15' },
      { id: 'rc-003', title: '半决赛专场充值', amount: '+ 800 XAF', status: '已到账', time: '2026-03-24 14:10' },
    ],
    [
      { id: 'rc-004', title: '夜场观赛充值', amount: '+ 600 XAF', status: '已到账', time: '2026-03-23 21:42' },
      { id: 'rc-005', title: '小组赛补给', amount: '+ 1,200 XAF', status: '已到账', time: '2026-03-23 11:08' },
      { id: 'rc-006', title: '冠军夜充值', amount: '+ 3,000 XAF', status: '已到账', time: '2026-03-22 16:30' },
    ],
  ],
  withdraw: [
    [
      { id: 'wd-001', title: '提现申请', amount: '- 500 XAF', status: '审核中', time: '2026-03-25 12:00' },
      { id: 'wd-002', title: '提现申请', amount: '- 300 XAF', status: '已完成', time: '2026-03-24 17:25' },
      { id: 'wd-003', title: '提现申请', amount: '- 900 XAF', status: '已完成', time: '2026-03-23 08:54' },
    ],
    [
      { id: 'wd-004', title: '提现申请', amount: '- 450 XAF', status: '已完成', time: '2026-03-22 19:20' },
      { id: 'wd-005', title: '提现申请', amount: '- 700 XAF', status: '已完成', time: '2026-03-22 10:12' },
      { id: 'wd-006', title: '提现申请', amount: '- 260 XAF', status: '已拒绝', time: '2026-03-21 15:45' },
    ],
  ],
  bet: [
    [
      { id: 'bt-001', title: 'A组焦点战', amount: '- 120 XAF', status: '已结算', time: '2026-03-25 21:00' },
      { id: 'bt-002', title: '四强专题竞猜', amount: '- 220 XAF', status: '进行中', time: '2026-03-25 18:30' },
      { id: 'bt-003', title: '金靴之争专题', amount: '- 90 XAF', status: '已结算', time: '2026-03-24 23:12' },
    ],
    [
      { id: 'bt-004', title: '冠军夜对决', amount: '- 300 XAF', status: '已结算', time: '2026-03-24 20:10' },
      { id: 'bt-005', title: '传奇宿敌专题', amount: '- 150 XAF', status: '已取消', time: '2026-03-23 13:22' },
      { id: 'bt-006', title: '小组赛特别场', amount: '- 80 XAF', status: '已结算', time: '2026-03-22 09:05' },
    ],
  ],
}

export const rechargeTips = [
  '扫码后按页面提示完成充值，后续只需替换正式二维码素材。',
  '当前为静态演示文案，金额与到账规则后续可接后台配置。',
  '如需接入真实支付，仅需替换二维码与说明字段即可。',
]
