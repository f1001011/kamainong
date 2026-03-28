<template>
  <div class="home-desktop">
    <section
      v-motion
      class="hero-layout"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
    >
      <article
        class="hero-banner"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(5, 18, 12, 0.14), rgba(5, 18, 12, 0.78)), url(${activeBanner.imageUrl})` }"
      >
        <div class="hero-banner-top">
          <div class="hero-brand">
            <span class="brand-mark">WC</span>
            <div>
              <strong>Football Match Center</strong>
              <small>桌面主场 · 自动切换布局</small>
            </div>
          </div>
          <span class="hero-pill">{{ activeBanner.tag }}</span>
        </div>

        <div class="hero-banner-copy">
          <p class="eyebrow">首页 Home</p>
          <h1>{{ activeBanner.title }}</h1>
          <p>{{ activeBanner.subtitle }}</p>
        </div>

        <div class="hero-banner-bottom">
          <div class="hero-metrics">
            <article v-for="metric in heroMetrics" :key="metric.label">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </article>
          </div>

          <div class="hero-dots">
            <button
              v-for="(banner, index) in banners"
              :key="banner.id"
              class="dot-btn"
              :class="{ active: index === bannerIndex }"
              @click="bannerIndex = index"
            ></button>
          </div>
        </div>
      </article>

      <aside
        v-motion
        class="hero-side"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 80 } }"
      >
        <section class="side-panel intro-panel">
          <p class="eyebrow light">桌面首屏</p>
          <h2>一屏完成氛围建立、内容分流和重点预览</h2>
          <p class="panel-copy">
            PC 端不再直接拉伸 H5，而是拆成主视觉、导览面板和多列内容区，扫图效率会更高。
          </p>
          <ul class="insight-list">
            <li v-for="item in narrativePoints" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section class="side-panel spotlight-panel">
          <div class="side-head">
            <div>
              <p class="eyebrow soft">快速预览</p>
              <h3>当前热门目录</h3>
            </div>
            <span>{{ spotlightCards.length }} 张</span>
          </div>

          <button
            v-for="(card, index) in spotlightCards"
            :key="card.id"
            class="spotlight-item"
            @click="bannerIndex = index % Math.max(banners.length, 1)"
          >
            <div class="spotlight-index">0{{ index + 1 }}</div>
            <div>
              <strong>{{ card.title }}</strong>
              <small>{{ card.subtitle }}</small>
            </div>
            <MiniTagBadge v-if="card.badge" :label="card.badge" />
          </button>
        </section>
      </aside>
    </section>

    <section
      v-motion
      class="gallery-panel"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 420, delay: 120 } }"
    >
      <div class="section-head">
        <div>
          <p class="eyebrow soft">世界杯画廊</p>
          <h2>桌面端先看完整内容目录</h2>
        </div>
        <div class="chip-row">
          <span v-for="chip in quickChips" :key="chip">{{ chip }}</span>
        </div>
      </div>

      <div class="gallery-grid">
        <article
          v-for="card in quickGallery"
          :key="card.id"
          class="gallery-card"
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 280 } }"
        >
          <div class="gallery-image" :style="{ backgroundImage: `url(${card.imageUrl})` }">
            <MiniTagBadge v-if="card.badge" :label="card.badge" />
          </div>
          <strong>{{ card.title }}</strong>
          <small>{{ card.subtitle }}</small>
        </article>
      </div>
    </section>

    <section
      v-for="(section, sectionIndex) in sections"
      :key="section.id"
      v-motion
      class="story-panel"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 440, delay: 180 + sectionIndex * 80 } }"
    >
      <div class="story-head">
        <div>
          <p class="eyebrow soft">{{ section.title }}</p>
          <h2>{{ section.subtitle }}</h2>
        </div>
        <span class="story-count">{{ section.cards.length }} 张专题图卡</span>
      </div>

      <div class="story-grid">
        <article v-for="card in section.cards" :key="card.id" class="story-card">
          <div
            class="story-image"
            :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.04), rgba(8, 22, 15, 0.76)), url(${card.imageUrl})` }"
          >
            <MiniTagBadge v-if="card.badge" :label="card.badge" />
            <div class="story-copy">
              <strong>{{ card.title }}</strong>
              <small>{{ card.subtitle }}</small>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MiniTagBadge from '@/components/ui/MiniTagBadge.vue'
import { fetchHomeContent } from '@/services/worldCupContent'
import type { BannerItem, HomeSection, ImageCardItem } from '@/config/worldCup'

const banners = ref<BannerItem[]>([])
const quickGallery = ref<ImageCardItem[]>([])
const sections = ref<HomeSection[]>([])
const bannerIndex = ref(0)
const quickChips = ['热门', '焦点', '球星', '图卡']
const narrativePoints = [
  '主视觉先负责建立赛事热度和品牌感',
  '右侧导览区负责快速分流，不把用户丢进长列表',
  '下面的多列卡片区负责稳定浏览节奏，适合 PC 扫读',
]
const heroMetrics = [
  { value: '04', label: '主栏目' },
  { value: '12', label: '专题图卡' },
  { value: '24H', label: '热度更新' },
]

let timer: ReturnType<typeof setInterval> | null = null

const activeBanner = computed(() => banners.value[bannerIndex.value] ?? banners.value[0] ?? {
  id: 'fallback',
  title: '世界杯主视觉',
  subtitle: '内容加载中',
  tag: '推荐',
  imageUrl: '',
})

const spotlightCards = computed(() => quickGallery.value.slice(0, 4))

async function loadContent() {
  const data = await fetchHomeContent()
  banners.value = data.banners
  quickGallery.value = data.quickGallery
  sections.value = data.sections
  startAutoPlay()
}

function startAutoPlay() {
  stopAutoPlay()
  if (banners.value.length <= 1) return
  timer = setInterval(() => {
    bannerIndex.value = (bannerIndex.value + 1) % banners.value.length
  }, 5000)
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  loadContent()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.home-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 320px),
    var(--wc-surface);
}

.hero-layout,
.gallery-panel,
.story-panel {
  max-width: 1400px;
  margin: 0 auto;
}

.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
  gap: 22px;
}

.hero-banner,
.gallery-panel,
.story-panel,
.side-panel {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.hero-banner {
  min-height: 560px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--wc-bg-soft);
  background-size: cover;
  background-position: center;
}

.hero-side {
  display: grid;
  gap: 18px;
}

.side-panel {
  padding: 24px;
}

.intro-panel {
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.98), rgba(20, 52, 41, 0.94));
  color: var(--wc-text-on-dark);
}

.spotlight-panel {
  background: var(--wc-surface-elevated);
}

.hero-banner-top,
.hero-brand,
.hero-banner-bottom,
.side-head,
.section-head,
.story-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-brand {
  align-items: center;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--wc-gold-soft), #f7e0ad);
  color: var(--wc-bg);
  font-size: 14px;
  font-weight: 800;
}

.hero-brand strong,
.hero-brand small {
  display: block;
  color: var(--wc-text-on-dark);
}

.hero-brand strong {
  font-size: 18px;
}

.hero-brand small {
  margin-top: 4px;
  color: var(--wc-text-on-dark-soft);
  font-size: 12px;
}

.hero-pill {
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--wc-text-on-dark);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.eyebrow.light {
  color: #b8e8d1;
}

.eyebrow.soft {
  color: var(--wc-green-soft);
}

.hero-banner-copy h1,
.section-head h2,
.story-head h2,
.intro-panel h2,
.side-head h3 {
  margin: 0;
}

.hero-banner-copy h1 {
  max-width: 540px;
  color: var(--wc-text-on-dark);
  font-size: 58px;
  line-height: 1.02;
}

.hero-banner-copy p:last-child,
.panel-copy {
  max-width: 540px;
  margin: 16px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.hero-banner-bottom {
  align-items: flex-end;
  flex-direction: column;
}

.hero-metrics {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-metrics article {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
}

.hero-metrics strong,
.hero-metrics span {
  display: block;
  color: var(--wc-text-on-dark);
}

.hero-metrics strong {
  font-size: 28px;
}

.hero-metrics span {
  margin-top: 8px;
  color: var(--wc-text-on-dark-soft);
  font-size: 13px;
}

.hero-dots {
  display: flex;
  gap: 10px;
}

.dot-btn {
  width: 10px;
  height: 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.32);
}

.dot-btn.active {
  width: 34px;
  background: linear-gradient(90deg, var(--wc-gold), var(--wc-blue));
}

.intro-panel h2 {
  color: var(--wc-text-on-dark);
  font-size: 28px;
  line-height: 1.22;
}

.insight-list {
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.insight-list li {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--wc-text-on-dark-soft);
  line-height: 1.6;
}

.side-head h3 {
  color: var(--wc-text);
  font-size: 22px;
}

.side-head span {
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-text-soft);
  font-size: 12px;
  font-weight: 700;
}

.spotlight-item {
  width: 100%;
  margin-top: 12px;
  padding: 16px 18px;
  border: 0;
  border-radius: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  background: rgba(27, 91, 65, 0.06);
  text-align: left;
}

.spotlight-index {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 35, 25, 0.06);
  color: var(--wc-green);
  font-size: 13px;
  font-weight: 800;
}

.spotlight-item strong,
.spotlight-item small {
  display: block;
}

.spotlight-item strong {
  color: var(--wc-text);
  font-size: 16px;
}

.spotlight-item small {
  margin-top: 5px;
  color: var(--wc-text-soft);
  line-height: 1.5;
}

.gallery-panel,
.story-panel {
  margin-top: 24px;
  padding: 24px;
  background: var(--wc-surface-elevated);
}

.section-head,
.story-head {
  align-items: center;
}

.section-head h2,
.story-head h2 {
  color: var(--wc-text);
  font-size: 34px;
  line-height: 1.14;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.chip-row span,
.story-count {
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-text-soft);
  font-size: 12px;
  font-weight: 700;
}

.gallery-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.gallery-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gallery-image {
  aspect-ratio: 0.95;
  padding: 10px;
  border-radius: 24px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.gallery-card strong,
.gallery-card small {
  display: block;
}

.gallery-card strong {
  color: var(--wc-text);
  font-size: 15px;
}

.gallery-card small {
  color: var(--wc-text-soft);
  line-height: 1.55;
}

.story-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.story-card {
  overflow: hidden;
  border-radius: 24px;
  background: var(--wc-card-strong);
  border: 1px solid var(--wc-border);
}

.story-image {
  min-height: 280px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.story-copy strong,
.story-copy small {
  display: block;
}

.story-copy strong {
  color: var(--wc-text-on-dark);
  font-size: 20px;
}

.story-copy small {
  margin-top: 7px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.55;
}
</style>
