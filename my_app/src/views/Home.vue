<template>
  <div class="home-root">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="page-scroll">
      <!-- Header -->
      <header class="page-header"
        v-motion :initial="{ opacity:0, y:-22 }"
        :enter="{ opacity:1, y:0, transition:{ delay:60 } }">
        <div class="header-left">
          <div class="avatar"><User :size="17" /></div>
          <div class="header-info">
            <span class="greeting">{{ t('home.greeting') }}</span>
            <span class="username">{{ t('home.welcome') }}</span>
          </div>
        </div>
        <button class="glass-icon-btn" @click="router.push('/balance')">
          <Wallet :size="18" />
        </button>
      </header>

      <!-- Balance Quick Card -->
      <div class="balance-quick glass-card"
        v-motion :initial="{ opacity:0, y:30, scale:0.95 }"
        :enter="{ opacity:1, y:0, scale:1, transition:{ delay:120, type:'spring', stiffness:200, damping:22 } }">
        <div class="bq-bar"></div>
        <div class="bq-left">
          <span class="bq-label">{{ t('home.balanceLabel') }}</span>
          <span class="bq-amount">{{ CURRENCY }} {{ balanceDisplay }}</span>
        </div>
        <button class="bq-btn" @click="router.push('/balance')">
          <ArrowRight :size="13" />{{ t('home.balanceCenter') }}
        </button>
      </div>

      <!-- Carousel -->
      <div class="carousel-wrap"
        v-motion :initial="{ opacity:0, y:24 }"
        :enter="{ opacity:1, y:0, transition:{ delay:200 } }"
        @mouseenter="pauseAuto" @mouseleave="resumeAuto">
        <div class="carousel-viewport">
          <div class="carousel-track"
            :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div v-for="banner in banners" :key="banner.id"
              class="carousel-slide"
              :style="banner.imageUrl ? {} : { background: banner.gradient }">
              <img v-if="banner.imageUrl" class="slide-bg-img" :src="banner.imageUrl" />
              <div class="slide-glow" :style="{ background: banner.glow }"></div>
              <div class="slide-content">
                <span class="slide-tag">{{ banner.tag }}</span>
                <div class="slide-title">{{ banner.title }}</div>
                <div class="slide-sub">{{ banner.sub }}</div>
              </div>
              <div v-if="!banner.imageUrl" class="slide-icon-wrap">
                <component :is="banner.icon" :size="54" class="slide-icon" />
              </div>
            </div>
          </div>
        </div>
        <div class="carousel-dots">
          <span v-for="(_, i) in banners" :key="i"
            :class="['dot', { active: i === currentSlide }]"
            @click="goTo(i)"></span>
        </div>
      </div>

      <!-- Categories -->
      <div class="category-row"
        v-motion :initial="{ opacity:0 }"
        :enter="{ opacity:1, transition:{ delay:300 } }">
        <button v-for="cat in displayCategories" :key="cat.key"
          :class="['cat-btn', { active: activeCategory === cat.key }]"
          :style="activeCategory === cat.key ? { '--ac': cat.color, borderColor: cat.color + '55' } : {}"
          @click="activeCategory = cat.key">
          <component :is="cat.icon" :size="12" />
          {{ catLabel(cat) }}
        </button>
      </div>

      <!-- Product Grid -->
      <div class="product-grid">
        <div v-for="(product, i) in displayProducts" :key="product.id"
          class="product-card glass-card"
          v-motion
          :initial="{ opacity:0, y:24, scale:0.92 }"
          :enter="{ opacity:1, y:0, scale:1, transition:{ delay: Math.min(360 + i*45, 800), type:'spring', stiffness:260, damping:20 } }">
          <div class="product-img" :style="{ background: product.gradient }">
            <div class="product-img-glow" :style="{ background: product.glow }"></div>
            <img v-if="product.imageUrl" class="product-img-pic" :src="product.imageUrl" />
            <div v-else class="product-icon-3d">
              <component :is="product.icon" :size="26" />
            </div>
            <span v-if="product.tag" class="product-tag-badge"
              :style="{ color: product.tagColor, borderColor: product.tagColor + '44', background: product.tagColor + '18' }">
              {{ product.tag }}
            </span>
          </div>
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-price" :style="{ color: product.priceColor }">{{ CURRENCY }}{{ product.price }}</div>
            <div class="product-stock">
              <ShoppingBag :size="9" />{{ t('home.purchasable', { n: product.maxPurchase }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="sentinel"></div>
      <div v-if="isLoading" class="load-tip">{{ t('home.loadingMore') }}</div>
      <div v-else-if="!hasMore && displayProducts.length > 0" class="load-tip">{{ t('home.noMore') }}</div>

      <div style="height:40px"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Component } from 'vue'
import { CURRENCY } from '@/config'
import { colors } from '@/config/colors'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  User, Wallet, ArrowRight, ShoppingBag,
  Zap, Phone, Crown, Gamepad2, Coffee,
  LayoutGrid, Flame, Gift, Star,
  Wifi, Signal, CreditCard, Music,
  Sword, Gem, ShoppingCart, Car,
} from 'lucide-vue-next'
import { fetchCategories, fetchProducts, fetchHomeBalance } from '@/api/product'
import type { CategoryItem, ProductItem } from '@/types/product'

const router = useRouter()
const { t, locale } = useI18n()

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, Component> = {
  layoutgrid: LayoutGrid, wifi: Wifi,       phone: Phone,       crown: Crown,
  gamepad2:   Gamepad2,   coffee: Coffee,   signal: Signal,     creditcard: CreditCard,
  music:      Music,      star:  Star,      sword:  Sword,      gem:   Gem,
  shoppingcart: ShoppingCart, car: Car,
}

// ── Category visual config ────────────────────────────────────────────────────
const CATEGORY_VISUAL: Record<string, { gradient: string; glow: string; priceColor: string }> = {
  data:   { gradient:'linear-gradient(160deg,rgba(0,229,255,0.14),rgba(0,176,255,0.06))',   glow:'radial-gradient(circle at 60% 40%,rgba(0,229,255,0.25),transparent 65%)',   priceColor:'#00e5ff' },
  phone:  { gradient:'linear-gradient(160deg,rgba(255,184,0,0.14),rgba(255,109,0,0.06))',   glow:'radial-gradient(circle at 60% 40%,rgba(255,184,0,0.25),transparent 65%)',   priceColor:'#ffb800' },
  member: { gradient:'linear-gradient(160deg,rgba(105,255,71,0.12),rgba(0,230,118,0.06))',  glow:'radial-gradient(circle at 60% 40%,rgba(105,255,71,0.22),transparent 65%)',  priceColor:'#69ff47' },
  game:   { gradient:'linear-gradient(160deg,rgba(255,77,77,0.14),rgba(255,23,68,0.06))',   glow:'radial-gradient(circle at 60% 40%,rgba(255,77,77,0.25),transparent 65%)',   priceColor:'#ff4d4d' },
  life:   { gradient:'linear-gradient(160deg,rgba(0,229,255,0.12),rgba(0,176,255,0.06))',   glow:'radial-gradient(circle at 60% 40%,rgba(0,229,255,0.22),transparent 65%)',   priceColor:'#00e5ff' },
}

// ── Tag color map ─────────────────────────────────────────────────────────────
const TAG_COLOR: Record<string, string> = {
  '热门': colors.red,   '推荐': colors.lime,  '爆款': colors.amber,
  '超值': colors.amber, '精选': colors.lime,
}

// ── Color map (colorKey → hex) ────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  red: colors.red, cyan: colors.cyan, amber: colors.amber, green: colors.lime,
}

// ── Carousel ──────────────────────────────────────────────────────────────────
const currentSlide = ref(0)
let autoTimer: ReturnType<typeof setInterval> | null = null

const banners = [
  { id:1, tag:'限时优惠', title:'充值立享 8 折', sub:'银行卡 / 支付宝 / 微信 均可',
    gradient:'linear-gradient(135deg,#ff4d4d,#ff1744)',
    glow:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.18),transparent 60%)',
    icon: Zap },
  { id:2, tag:'新用户专享', title:'首充赠送 50 元', sub:'注册即送，充值立到账',
    gradient:'linear-gradient(135deg,#00e5ff,#00b0ff)',
    glow:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.18),transparent 60%)',
    icon: Gift },
  { id:3, tag:'限时秒杀', title:'低至 1 折起', sub:'每日 10:00 准时开抢',
    gradient:'linear-gradient(135deg,#ffb800,#ff6d00)',
    glow:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.18),transparent 60%)',
    icon: Flame },
  { id:4, tag:'VIP 专属', title:'会员特权礼包', sub:'专属折扣 · 优先客服 · 专属礼包',
    gradient:'linear-gradient(135deg,#69ff47,#00e676)',
    glow:'radial-gradient(circle at 30% 50%,rgba(255,255,255,0.18),transparent 60%)',
    icon: Crown },
]

const goTo       = (i: number) => { currentSlide.value = i }
const next       = () => { currentSlide.value = (currentSlide.value + 1) % banners.length }
const startAuto  = () => { autoTimer = setInterval(next, 2000) }
const pauseAuto  = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null } }
const resumeAuto = () => { if (!autoTimer) startAuto() }

// ── Balance ───────────────────────────────────────────────────────────────────
const homeBalance = ref(0)
const balanceDisplay = computed(() =>
  homeBalance.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
)

async function loadHomeBalance() {
  try {
    const data = await fetchHomeBalance()
    homeBalance.value = data.totalAssets
  } catch { /* silent */ }
}

// ── Categories ────────────────────────────────────────────────────────────────
const activeCategory  = ref('all')
const categoriesRaw   = ref<CategoryItem[]>([])

const displayCategories = computed(() =>
  categoriesRaw.value.map(cat => ({
    ...cat,
    icon:  ICON_MAP[cat.iconKey]  ?? LayoutGrid,
    color: COLOR_MAP[cat.colorKey] ?? '#ff4d4d',
  }))
)

function catLabel(cat: CategoryItem & { icon: Component; color: string }) {
  return locale.value === 'zh' ? cat.labelZh : cat.labelEn
}

async function loadCategories() {
  try {
    categoriesRaw.value = await fetchCategories()
  } catch { /* silent */ }
}

// ── Products ──────────────────────────────────────────────────────────────────
const productList = ref<ProductItem[]>([])
const page        = ref(1)
const hasMore     = ref(true)
const isLoading   = ref(false)
const PAGE_SIZE   = 10

const displayProducts = computed(() =>
  productList.value.map(p => {
    const visual = CATEGORY_VISUAL[p.category] ?? CATEGORY_VISUAL['data']
    return {
      ...p,
      icon:       ICON_MAP[p.iconKey] ?? Wifi,
      gradient:   visual.gradient,
      glow:       visual.glow,
      priceColor: visual.priceColor,
      tagColor:   TAG_COLOR[p.tag] ?? '',
    }
  })
)

async function loadProducts(reset = false) {
  if (isLoading.value) return
  if (!reset && !hasMore.value) return
  isLoading.value = true
  if (reset) {
    page.value = 1
    productList.value = []
    hasMore.value = true
  }
  try {
    const result = await fetchProducts({
      category: activeCategory.value,
      page:     page.value,
      pageSize: PAGE_SIZE,
    })
    productList.value = reset ? result.list : [...productList.value, ...result.list]
    hasMore.value = result.hasMore
    page.value++
  } catch {
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}

// ── Infinite scroll ───────────────────────────────────────────────────────────
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && hasMore.value && !isLoading.value) {
        loadProducts()
      }
    },
    { rootMargin: '120px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
}

watch(activeCategory, () => {
  loadProducts(true).then(() => nextTick(setupObserver))
})

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts(true), loadHomeBalance()])
  startAuto()
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  pauseAuto()
  if (observer) observer.disconnect()
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Root & BG ─────────────────────────────────────────────────────────────── */
.home-root {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative; overflow: hidden;
  font-family: 'Inter','SF Pro Text',-apple-system,BlinkMacSystemFont,'PingFang SC','Noto Sans SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red  { width:480px; height:480px; top:-100px; left:-80px;  background:var(--orb-red);   animation:drift 16s ease-in-out infinite; }
.orb-cyan { width:400px; height:400px; top:30%;    right:-60px; background:var(--orb-cyan);  animation:drift 20s ease-in-out infinite reverse; }
.orb-amber{ width:340px; height:340px; bottom:10%; left:15%;    background:var(--orb-amber); animation:drift 24s ease-in-out infinite 5s; }
@keyframes drift {
  0%,100% { transform:translate(0,0) scale(1); }
  40%     { transform:translate(24px,-18px) scale(1.05); }
  70%     { transform:translate(-16px,14px) scale(0.96); }
}

.page-scroll { position:relative; z-index:1; max-width:460px; margin:0 auto; padding:0 18px 80px; }

/* ── Glass card ────────────────────────────────────────────────────────────── */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid var(--border);
  border-radius: 20px;
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.page-header {
  display:flex; align-items:center; justify-content:space-between;
  padding: 52px 0 18px;
}
.header-left { display:flex; align-items:center; gap:11px; }
.avatar {
  width:38px; height:38px; border-radius:12px;
  background: linear-gradient(135deg,#ff4d4d,#ff1744);
  display:flex; align-items:center; justify-content:center;
  color:#fff;
  box-shadow: 0 0 14px rgba(255,77,77,0.4);
}
.header-info { display:flex; flex-direction:column; gap:1px; }
.greeting  { font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:0.3px; }
.username  { font-size:14px; font-weight:600; color:rgba(255,255,255,0.88); }
.glass-icon-btn {
  width:38px; height:38px; border-radius:11px;
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
  color:rgba(255,255,255,0.6);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:background 0.2s, transform 0.15s;
}
.glass-icon-btn:hover  { background:rgba(255,255,255,0.1); }
.glass-icon-btn:active { transform:scale(0.93); }

/* ── Balance Quick Card ────────────────────────────────────────────────────── */
.balance-quick {
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 18px; margin-bottom:16px;
}
.bq-bar {
  position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,#ff4d4d,#00e5ff,#ffb800);
  border-radius:20px 20px 0 0;
}
.bq-left { display:flex; flex-direction:column; gap:3px; }
.bq-label { font-size:10px; font-weight:400; letter-spacing:0.8px; color:rgba(255,255,255,0.35); text-transform:uppercase; }
.bq-amount { font-size:20px; font-weight:700; color:#fff; letter-spacing:-0.5px; }
.bq-btn {
  display:flex; align-items:center; gap:5px;
  padding:8px 14px; border-radius:10px;
  background:rgba(255,77,77,0.12); border:1px solid rgba(255,77,77,0.3);
  color:#ff8080; font-size:12px; font-weight:500;
  cursor:pointer; transition:all 0.2s; font-family:inherit;
}
.bq-btn:hover { background:rgba(255,77,77,0.2); color:#ff4d4d; }

/* ── Carousel ──────────────────────────────────────────────────────────────── */
.carousel-wrap { margin-bottom:18px; }
.carousel-viewport {
  border-radius:18px; overflow:hidden;
  box-shadow:0 8px 32px rgba(0,0,0,0.4);
}
.carousel-track {
  display:flex;
  transition:transform 0.55s cubic-bezier(0.4,0,0.2,1);
}
.carousel-slide {
  min-width:100%; height:148px;
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px;
}
.slide-glow { position:absolute; inset:0; pointer-events:none; }
.slide-content { position:relative; z-index:1; }
.slide-tag {
  display:inline-block;
  font-size:10px; font-weight:600; letter-spacing:0.8px;
  color:rgba(255,255,255,0.9);
  background:rgba(255,255,255,0.18); border-radius:20px;
  padding:2px 9px; margin-bottom:8px;
}
.slide-title {
  font-size:22px; font-weight:800; color:#fff;
  letter-spacing:-0.5px; line-height:1.15; margin-bottom:6px;
}
.slide-sub { font-size:11px; color:rgba(255,255,255,0.65); letter-spacing:0.2px; }
.slide-icon-wrap { position:relative; z-index:1; opacity:0.22; }
.slide-icon { color:#fff; }
.slide-bg-img {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; z-index:0;
}

.carousel-dots {
  display:flex; justify-content:center; gap:6px; margin-top:10px;
}
.dot {
  width:6px; height:6px; border-radius:50%;
  background:rgba(255,255,255,0.2);
  cursor:pointer; transition:all 0.3s;
}
.dot.active { width:18px; border-radius:3px; background:#ff4d4d; }

/* ── Categories ────────────────────────────────────────────────────────────── */
.category-row {
  display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:16px;
  scrollbar-width:none;
}
.category-row::-webkit-scrollbar { display:none; }
.cat-btn {
  display:flex; align-items:center; gap:5px;
  padding:7px 14px; border-radius:20px; white-space:nowrap;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
  color:rgba(255,255,255,0.45); font-size:12px; font-weight:500;
  cursor:pointer; transition:all 0.22s; font-family:inherit;
  flex-shrink:0;
}
.cat-btn:hover { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.75); }
.cat-btn.active {
  background:color-mix(in srgb, var(--ac) 14%, transparent);
  border-color:var(--ac);
  color:var(--ac);
}

/* ── Product Grid ──────────────────────────────────────────────────────────── */
.product-grid {
  display:grid; grid-template-columns:repeat(2,1fr);
  gap:12px;
}
.product-card {
  overflow:hidden; cursor:pointer;
  transition:transform 0.2s, box-shadow 0.2s;
}
.product-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.35); }
.product-card:active { transform:scale(0.97); }

.product-img {
  position:relative; height:110px;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden;
}
.product-img-glow { position:absolute; inset:0; pointer-events:none; }
.product-img-pic {
  position:relative; z-index:1;
  width:72px; height:72px; object-fit:cover;
  border-radius:14px;
}
.product-icon-3d {
  position:relative; z-index:1;
  width:54px; height:54px; border-radius:16px;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.12);
  display:flex; align-items:center; justify-content:center;
  color:rgba(255,255,255,0.85);
  transform:perspective(100px) rotateX(10deg) rotateY(-7deg);
  box-shadow:3px 4px 0 rgba(0,0,0,0.3), 6px 8px 0 rgba(0,0,0,0.15);
  transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
}
.product-card:hover .product-icon-3d {
  transform:perspective(100px) rotateX(5deg) rotateY(-3deg) translateY(-4px);
  box-shadow:5px 7px 0 rgba(0,0,0,0.3), 10px 14px 0 rgba(0,0,0,0.15);
}
.product-tag-badge {
  position:absolute; top:9px; right:9px;
  font-size:9px; font-weight:600; letter-spacing:0.5px;
  padding:2px 7px; border-radius:20px; border:1px solid;
}

.product-info { padding:12px 13px 13px; }
.product-name {
  font-size:12px; font-weight:500; color:rgba(255,255,255,0.82);
  margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.product-price { font-size:17px; font-weight:700; margin-bottom:5px; letter-spacing:-0.3px; }
.product-stock {
  display:flex; align-items:center; gap:4px;
  font-size:10px; color:rgba(255,255,255,0.28); letter-spacing:0.2px;
}

/* ── Infinite scroll ───────────────────────────────────────────────────────── */
.sentinel { height:1px; }
.load-tip {
  text-align:center; padding:16px 0;
  font-size:12px; color:rgba(255,255,255,0.25); letter-spacing:0.3px;
}
</style>
