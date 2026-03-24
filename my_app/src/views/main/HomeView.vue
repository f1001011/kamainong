<template>
  <div class="home-page">
    <section class="hero-shell">
      <div class="hero-bg"></div>
      <div class="hero-glow hero-glow-gold"></div>
      <div class="hero-glow hero-glow-green"></div>

      <header class="hero-header">
        <div>
          <p class="hero-brand">Architectural Precision</p>
          <h1>{{ greeting }}<span v-if="nickname">، {{ nickname }}</span></h1>
        </div>
        <button class="hero-action" @click="router.push('/profile')">الملف الشخصي</button>
      </header>

      <section class="balance-card">
        <div>
          <span class="balance-label">الرصيد المتاح</span>
          <strong class="balance-amount">{{ CURRENCY }} {{ balanceDisplay }}</strong>
        </div>
        <div class="balance-stats">
          <div>
            <span>المجمّد</span>
            <strong>{{ CURRENCY }} {{ frozenBalance }}</strong>
          </div>
          <div>
            <span>دخل اليوم</span>
            <strong>{{ CURRENCY }} {{ todayIncome }}</strong>
          </div>
          <div>
            <span>الإجمالي</span>
            <strong>{{ CURRENCY }} {{ totalIncome }}</strong>
          </div>
        </div>
      </section>
    </section>

    <main class="content-shell">
      <section class="section-block">
        <div class="section-head">
          <p>محفظتي</p>
          <h2>لوحة استثمار يومية بإيقاع Honeywell.</h2>
        </div>
        <div class="portfolio-card">
          <div>
            <span>الطلبات النشطة</span>
            <strong>{{ positionSummary.activeCount }}</strong>
          </div>
          <div>
            <span>إجمالي الاستثمار</span>
            <strong>{{ CURRENCY }} {{ positionSummary.totalPurchaseAmount }}</strong>
          </div>
          <div>
            <span>دخل اليوم</span>
            <strong class="positive">{{ CURRENCY }} {{ positionSummary.todayIncome }}</strong>
          </div>
          <div>
            <span>العائد التراكمي</span>
            <strong>{{ CURRENCY }} {{ positionSummary.totalEarned }}</strong>
          </div>
        </div>
      </section>

      <section class="bento-grid">
        <article class="signin-card">
          <p>签到 / Sign-in</p>
          <h3>{{ signIn.current }} / {{ signIn.target }}</h3>
          <span>连续签到进度</span>
          <button @click="router.push('/activities')">查看活动</button>
        </article>
        <article class="team-card">
          <p>الفريق</p>
          <h3>{{ teamStats.totalMembers }}</h3>
          <span>إجمالي الأعضاء</span>
          <strong>{{ CURRENCY }} {{ teamStats.totalCommission }}</strong>
        </article>
      </section>

      <section class="section-block">
        <div class="section-head">
          <p>عقارات مميزة</p>
          <h2>منتجات مختارة بأسلوب تحريري هادئ.</h2>
        </div>
        <div class="product-strip">
          <article v-for="product in products" :key="product.id" class="product-card" @click="openProduct(product.id)">
            <div class="product-cover" :style="{ backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined }">
              <span v-if="product.tag">{{ product.tag }}</span>
            </div>
            <div class="product-body">
              <strong>{{ product.name }}</strong>
              <p>{{ CURRENCY }} {{ product.price }}</p>
              <small>可购 {{ product.maxPurchase }}</small>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <p>Banner</p>
          <h2>轮播与公告保持 Honeywell 的展示节奏。</h2>
        </div>
        <div class="banner-frame">
          <button class="banner-arrow" @click="prevBanner">‹</button>
          <article class="banner-card" @click="openBanner">
            <img v-if="currentBanner.image_url" :src="currentBanner.image_url" alt="banner" />
            <div class="banner-copy">
              <span>{{ currentBanner.tag || 'Promotion' }}</span>
              <h3>{{ currentBanner.title || 'Featured Banner' }}</h3>
              <p>{{ currentBanner.subtitle || 'No banner copy available' }}</p>
            </div>
          </article>
          <button class="banner-arrow" @click="nextBanner">›</button>
        </div>
      </section>
    </main>

    <NoticeModal :show="showNotice" :content="noticeContent" @close="showNotice = false" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NoticeModal from '@/components/NoticeModal.vue'
import { CURRENCY } from '@/config'
import request from '@/api/request'
import { fetchProducts, fetchHomeBalance } from '@/api/product'
import { getBannerList } from '@/api/banner'
import { getSystemConfig } from '@/api/system'
import type { ProductItem } from '@/types/product'

interface PositionSummary {
  activeCount: number
  totalPurchaseAmount: string
  todayIncome: string
  totalEarned: string
}

interface TeamStats {
  totalMembers: number
  totalCommission: string
}

const router = useRouter()

const nickname = ref('')
const availableBalance = ref(0)
const frozenBalance = ref('0.00')
const todayIncome = ref('0.00')
const totalIncome = ref('0.00')
const positionSummary = ref<PositionSummary>({
  activeCount: 0,
  totalPurchaseAmount: '0.00',
  todayIncome: '0.00',
  totalEarned: '0.00',
})
const teamStats = ref<TeamStats>({ totalMembers: 0, totalCommission: '0.00' })
const signIn = ref({ current: 4, target: 7 })
const products = ref<ProductItem[]>([])
const banners = ref<Array<{ id: number | string; tag: string; title: string; subtitle: string; image_url: string; link_url: string }>>([])
const bannerIndex = ref(0)
const showNotice = ref(false)
const noticeContent = ref('')
let bannerTimer: ReturnType<typeof setInterval> | null = null

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'صباح الخير'
  if (hour < 19) return 'مساء الخير'
  return 'مساء الخير'
})

const balanceDisplay = computed(() => availableBalance.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

const currentBanner = computed(() => banners.value[bannerIndex.value] || { id: 'fallback', tag: 'Promotion', title: 'Featured Banner', subtitle: 'No banner copy available', image_url: '', link_url: '' })

function openProduct(id: number | string) {
  router.push(`/products/${id}`)
}

function openBanner() {
  if (currentBanner.value.link_url) router.push(currentBanner.value.link_url)
}

function nextBanner() {
  if (!banners.value.length) return
  bannerIndex.value = (bannerIndex.value + 1) % banners.value.length
}

function prevBanner() {
  if (!banners.value.length) return
  bannerIndex.value = (bannerIndex.value - 1 + banners.value.length) % banners.value.length
}

function startBannerAuto() {
  stopBannerAuto()
  if (banners.value.length <= 1) return
  bannerTimer = setInterval(nextBanner, 5000)
}

function stopBannerAuto() {
  if (bannerTimer) {
    clearInterval(bannerTimer)
    bannerTimer = null
  }
}

async function loadHomeData() {
  try {
    const [balanceRes, productRes, bannerRes] = await Promise.all([
      fetchHomeBalance(),
      fetchProducts({ page: 1, pageSize: 6 }),
      getBannerList(),
    ])
    availableBalance.value = balanceRes.totalAssets
    products.value = productRes.list.slice(0, 6)
    banners.value = bannerRes.list
    startBannerAuto()
  } catch {
    products.value = []
    banners.value = []
  }

  try {
    const profile = await request.get('/user/profile')
    nickname.value = profile.nickname || ''
    frozenBalance.value = String(profile.frozenBalance || '0.00')
    todayIncome.value = String(profile.todayIncome || '0.00')
    totalIncome.value = String(profile.totalIncome || '0.00')
  } catch {
    nickname.value = ''
  }

  try {
    const positions = await request.get('/positions')
    positionSummary.value = {
      activeCount: Number(positions?.summary?.activeCount || positions?.summary?.active_count || 0),
      totalPurchaseAmount: String(positions?.summary?.totalPurchaseAmount || positions?.summary?.total_purchase_amount || '0.00'),
      todayIncome: String(positions?.summary?.todayIncome || positions?.summary?.today_income || '0.00'),
      totalEarned: String(positions?.summary?.totalEarned || positions?.summary?.total_earned || '0.00'),
    }
  } catch {
    positionSummary.value = { activeCount: 0, totalPurchaseAmount: '0.00', todayIncome: '0.00', totalEarned: '0.00' }
  }

  try {
    const team = await request.get('/team/stats')
    teamStats.value = {
      totalMembers: Number(team.totalMembers || team.total_members || 0),
      totalCommission: String(team.totalCommission || team.total_commission || '0.00'),
    }
  } catch {
    teamStats.value = { totalMembers: 0, totalCommission: '0.00' }
  }

  try {
    const notice = await getSystemConfig('home_notice')
    if (notice) {
      noticeContent.value = notice
      showNotice.value = true
    }
  } catch {
    noticeContent.value = ''
  }
}

onMounted(() => {
  loadHomeData()
})

onUnmounted(() => {
  stopBannerAuto()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #fafaf7;
}

.hero-shell {
  position: relative;
  overflow: hidden;
  padding: 28px 18px 34px;
  background: linear-gradient(170deg, #081711 0%, #0d2f21 55%, #0d6b3d 100%);
}

.hero-bg,
.hero-glow {
  position: absolute;
  pointer-events: none;
}

.hero-bg {
  inset: 0;
  background: radial-gradient(circle at 86% 16%, rgba(201, 169, 110, 0.12), transparent 24%);
}

.hero-glow {
  border-radius: 999px;
  filter: blur(60px);
}

.hero-glow-gold {
  top: -40px;
  left: -60px;
  width: 220px;
  height: 220px;
  background: rgba(201, 169, 110, 0.18);
}

.hero-glow-green {
  right: -80px;
  bottom: -100px;
  width: 280px;
  height: 280px;
  background: rgba(13, 107, 61, 0.3);
}

.hero-header,
.balance-card,
.content-shell {
  position: relative;
  z-index: 1;
}

.hero-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-brand {
  margin: 0 0 8px;
  color: rgba(208, 172, 115, 0.9);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 11px;
}

.hero-header h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(28px, 6vw, 44px);
  line-height: 1.08;
}

.hero-action {
  border: 0;
  border-radius: 999px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-weight: 700;
}

.balance-card {
  margin-top: 22px;
  padding: 22px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.balance-label,
.balance-stats span {
  color: rgba(255, 255, 255, 0.58);
}

.balance-label {
  display: block;
  margin-bottom: 8px;
}

.balance-amount {
  display: block;
  color: #fff;
  font-size: clamp(28px, 7vw, 44px);
}

.balance-stats {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.balance-stats strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 16px;
}

.content-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 18px 100px;
}

.section-block + .section-block,
.bento-grid + .section-block {
  margin-top: 28px;
}

.section-head p {
  margin: 0 0 10px;
  color: #8f6c3a;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.section-head h2 {
  margin: 0;
  color: #17392a;
  font-size: clamp(24px, 4vw, 38px);
  line-height: 1.15;
}

.portfolio-card,
.signin-card,
.team-card,
.product-card,
.banner-card {
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
}

.portfolio-card {
  margin-top: 18px;
  padding: 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.portfolio-card span,
.signin-card p,
.team-card p,
.product-body small,
.banner-copy span,
.banner-copy p {
  color: rgba(23, 57, 42, 0.62);
}

.portfolio-card strong,
.signin-card h3,
.team-card h3,
.team-card strong,
.product-body strong,
.product-body p,
.banner-copy h3 {
  display: block;
  color: #17392a;
}

.portfolio-card strong {
  margin-top: 8px;
  font-size: 24px;
}

.positive {
  color: #0d6b3d;
}

.bento-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1.62fr 1fr;
  gap: 14px;
}

.signin-card,
.team-card {
  padding: 24px;
}

.signin-card h3,
.team-card h3 {
  font-size: 40px;
  margin: 10px 0 8px;
}

.signin-card button {
  margin-top: 18px;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #d0ac73, #8f6c3a);
  color: #111;
  font-weight: 700;
}

.team-card strong {
  margin-top: 18px;
  font-size: 28px;
  color: #8f6c3a;
}

.product-strip {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.product-card {
  overflow: hidden;
  cursor: pointer;
}

.product-cover {
  height: 220px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 14px;
  background: linear-gradient(135deg, rgba(13, 107, 61, 0.12), rgba(201, 169, 110, 0.18));
  background-size: cover;
  background-position: center;
}

.product-cover span {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.84);
  color: #17392a;
  font-size: 12px;
  font-weight: 700;
}

.product-body {
  padding: 18px;
}

.product-body p {
  margin: 10px 0 6px;
  font-size: 20px;
  color: #0d6b3d;
}

.banner-frame {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  gap: 12px;
  align-items: center;
}

.banner-arrow {
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 999px;
  background: rgba(13, 107, 61, 0.08);
  color: #17392a;
  font-size: 32px;
}

.banner-card {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) 1.1fr;
}

.banner-card img {
  width: 100%;
  height: 100%;
  min-height: 240px;
  object-fit: cover;
}

.banner-copy {
  padding: 28px;
}

.banner-copy h3 {
  margin: 10px 0;
  font-size: 30px;
}

@media (max-width: 960px) {
  .portfolio-card,
  .bento-grid,
  .product-strip,
  .banner-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-shell,
  .content-shell {
    padding-left: 14px;
    padding-right: 14px;
  }

  .balance-stats,
  .banner-frame {
    grid-template-columns: 1fr;
  }

  .banner-arrow {
    display: none;
  }
}
</style>
