import request from './request'
import type {
  ApiResponse,
} from '@/types/balance'
import type {
  CategoryItem, ProductItem, ProductListData,
  ProductListParams, HomeBalanceData,
} from '@/types/product'

// ── 接口路由（后续直接在此修改）──────────────────────────────────────────────
const API_CATEGORIES    = '/home/categories'
const API_PRODUCT_LIST  = '/home/products'
const API_HOME_BALANCE  = '/home/balance'

// ── Mock：分类 ────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES: CategoryItem[] = [
  { key:'all',    labelZh:'全部',   labelEn:'All',        iconKey:'layoutgrid', colorKey:'red'   },
  { key:'data',   labelZh:'流量包', labelEn:'Data',       iconKey:'wifi',       colorKey:'cyan'  },
  { key:'phone',  labelZh:'话费',   labelEn:'Phone',      iconKey:'phone',      colorKey:'amber' },
  { key:'member', labelZh:'会员',   labelEn:'Membership', iconKey:'crown',      colorKey:'green' },
  { key:'game',   labelZh:'游戏',   labelEn:'Gaming',     iconKey:'gamepad2',   colorKey:'red'   },
  { key:'life',   labelZh:'生活',   labelEn:'Lifestyle',  iconKey:'coffee',     colorKey:'cyan'  },
]

// ── Mock：商品（共 20 条）────────────────────────────────────────────────────
const MOCK_PRODUCTS: ProductItem[] = [
  { id:1,  category:'data',   name:'100MB 日包',     price:1,    maxPurchase:5,  tag:'热门', iconKey:'wifi'        },
  { id:2,  category:'data',   name:'1GB 周包',       price:5,    maxPurchase:3,  tag:'',     iconKey:'signal'      },
  { id:3,  category:'data',   name:'5GB 月包',       price:18,   maxPurchase:2,  tag:'推荐', iconKey:'wifi'        },
  { id:4,  category:'data',   name:'无限流量月包',   price:68,   maxPurchase:1,  tag:'爆款', iconKey:'signal'      },
  { id:5,  category:'phone',  name:'10 元话费',      price:9.8,  maxPurchase:10, tag:'',     iconKey:'phone'       },
  { id:6,  category:'phone',  name:'30 元话费',      price:29.5, maxPurchase:5,  tag:'热门', iconKey:'phone'       },
  { id:7,  category:'phone',  name:'50 元话费',      price:49,   maxPurchase:5,  tag:'',     iconKey:'creditcard'  },
  { id:8,  category:'phone',  name:'100 元话费',     price:98,   maxPurchase:3,  tag:'',     iconKey:'creditcard'  },
  { id:9,  category:'member', name:'爱奇艺月卡',     price:15,   maxPurchase:3,  tag:'热门', iconKey:'crown'       },
  { id:10, category:'member', name:'腾讯视频月卡',   price:15,   maxPurchase:3,  tag:'',     iconKey:'star'        },
  { id:11, category:'member', name:'网易云音乐年卡', price:88,   maxPurchase:1,  tag:'超值', iconKey:'music'       },
  { id:12, category:'member', name:'B站大会员月卡',  price:25,   maxPurchase:3,  tag:'',     iconKey:'crown'       },
  { id:13, category:'game',   name:'王者荣耀 648',   price:64,   maxPurchase:2,  tag:'热门', iconKey:'sword'       },
  { id:14, category:'game',   name:'原神 648 结晶',  price:64,   maxPurchase:2,  tag:'爆款', iconKey:'gem'         },
  { id:15, category:'game',   name:'Steam 100 元',   price:98,   maxPurchase:5,  tag:'',     iconKey:'gamepad2'    },
  { id:16, category:'game',   name:'网易游戏币 100', price:98,   maxPurchase:5,  tag:'',     iconKey:'gamepad2'    },
  { id:17, category:'life',   name:'滴滴出行券',     price:9.9,  maxPurchase:5,  tag:'热门', iconKey:'car'         },
  { id:18, category:'life',   name:'美团外卖券',     price:19.9, maxPurchase:3,  tag:'',     iconKey:'shoppingcart'},
  { id:19, category:'life',   name:'星巴克咖啡券',   price:38,   maxPurchase:2,  tag:'精选', iconKey:'coffee'      },
  { id:20, category:'life',   name:'京东 E 卡 100',  price:98,   maxPurchase:3,  tag:'',     iconKey:'creditcard'  },
]

// ── Mock：首页余额 ────────────────────────────────────────────────────────────
const MOCK_HOME_BALANCE: HomeBalanceData = { totalAssets: 128450.88 }

// ── 获取分类列表 ──────────────────────────────────────────────────────────────
export async function fetchCategories(): Promise<CategoryItem[]> {
  // 接口就绪后取消注释：
  // return request.get<CategoryItem[]>(API_CATEGORIES)
  return new Promise(resolve => setTimeout(() => resolve(MOCK_CATEGORIES), 300))
}

// ── 获取商品列表（分页）──────────────────────────────────────────────────────
export async function fetchProducts(params: ProductListParams): Promise<ProductListData> {
  // 接口就绪后取消注释：
  // return request.get<ProductListData>(API_PRODUCT_LIST, { params })

  const source = params.category === 'all'
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter(p => p.category === params.category)
  const start = (params.page - 1) * params.pageSize
  const list  = source.slice(start, start + params.pageSize)
  return new Promise(resolve => setTimeout(() => resolve({
    list,
    total:   source.length,
    hasMore: start + params.pageSize < source.length,
  }), 500))
}

// ── 获取首页余额快览 ──────────────────────────────────────────────────────────
export async function fetchHomeBalance(): Promise<HomeBalanceData> {
  // 接口就绪后取消注释：
  // return request.get<HomeBalanceData>(API_HOME_BALANCE)
  return new Promise(resolve => setTimeout(() => resolve(MOCK_HOME_BALANCE), 300))
}
