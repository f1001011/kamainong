<template>
  <div class="home-page">
    <section
      v-motion
      class="hero-stage"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
    >
      <div
        class="hero-frame"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(5, 18, 12, 0.12), rgba(5, 18, 12, 0.72)), url(${activeBanner.imageUrl})` }"
      >
        <div class="hero-topbar">
          <div class="hero-brand">
            <span class="brand-mark">WC</span>
            <div>
              <strong>Football H5</strong>
              <small>赛事热点推荐</small>
            </div>
          </div>
          <span class="hero-pill">{{ activeBanner.tag }}</span>
        </div>

        <div class="hero-copy">
          <p class="hero-kicker">首页</p>
          <h1>{{ activeBanner.title }}</h1>
          <p>{{ activeBanner.subtitle }}</p>
        </div>

        <div class="hero-bottom">
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
      </div>
    </section>

    <div class="surface-stack">
      <section
        v-motion
        class="quick-panel"
        :initial="{ opacity: 0, y: 18 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 480, delay: 80 } }"
      >
        <div class="section-head">
          <div>
            <p>世界杯画廊</p>
            <h2>先看值得点开的足球内容</h2>
          </div>
          <div class="filter-row">
            <span v-for="chip in quickChips" :key="chip">{{ chip }}</span>
          </div>
        </div>

        <div class="quick-grid">
          <article
            v-for="card in quickGallery"
            :key="card.id"
            class="quick-card"
            v-motion
            :initial="{ opacity: 0, scale: 0.94 }"
            :enter="{ opacity: 1, scale: 1, transition: { duration: 320 } }"
          >
            <div class="quick-image" :style="{ backgroundImage: `url(${card.imageUrl})` }">
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
        class="story-block"
        :initial="{ opacity: 0, y: 18 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 500, delay: 100 + sectionIndex * 80 } }"
      >
        <div class="section-head compact">
          <div>
            <p>{{ section.title }}</p>
            <h2>{{ section.subtitle }}</h2>
          </div>
        </div>

        <div class="feature-grid">
          <article v-for="card in section.cards" :key="card.id" class="feature-card">
            <div
              class="feature-image"
              :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.02), rgba(8, 22, 15, 0.76)), url(${card.imageUrl})` }"
            >
              <MiniTagBadge v-if="card.badge" :label="card.badge" />
              <div class="feature-copy">
                <strong>{{ card.title }}</strong>
                <small>{{ card.subtitle }}</small>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
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
const quickChips = ['热门', '强强对决', '球星', '看台']
const heroMetrics = [
  { value: '32', label: '参赛球队' },
  { value: '64', label: '赛事故事' },
  { value: '24H', label: '球迷热度' },
]

let timer: ReturnType<typeof setInterval> | null = null

const activeBanner = computed(() => banners.value[bannerIndex.value] ?? banners.value[0] ?? {
  id: 'fallback',
  title: '世界杯主视觉',
  subtitle: '内容加载中',
  tag: '推荐',
  imageUrl: '',
})

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
  }, 4500)
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
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--wc-bg) 0 330px, var(--wc-surface) 330px 100%);
}

.hero-stage {
  padding: 12px 12px 0;
}

.hero-frame {
  min-height: 328px;
  padding: 18px;
  border-radius: var(--wc-radius-xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--wc-bg-soft);
  background-size: cover;
  background-position: center;
  box-shadow: 0 28px 72px rgba(4, 14, 10, 0.22);
}

.hero-topbar,
.hero-brand,
.hero-bottom,
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-brand {
  align-items: center;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--wc-gold-soft), #f8e6bd);
  color: var(--wc-bg);
  font-size: 12px;
  font-weight: 800;
}

.hero-brand strong,
.hero-brand small,
.hero-copy,
.hero-metrics strong,
.hero-metrics span,
.hero-pill {
  color: var(--wc-text-on-dark);
}

.hero-brand strong {
  display: block;
  font-size: 14px;
}

.hero-brand small {
  display: block;
  margin-top: 2px;
  color: var(--wc-text-on-dark-soft);
  font-size: 11px;
}

.hero-pill {
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-kicker,
.section-head p {
  margin: 0 0 10px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.hero-copy h1,
.section-head h2 {
  margin: 0;
}

.hero-copy h1 {
  max-width: 260px;
  font-size: 34px;
  line-height: 1.08;
}

.hero-copy p:last-child {
  max-width: 300px;
  margin: 12px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}

.hero-bottom {
  align-items: flex-end;
  flex-direction: column;
}

.hero-metrics {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-metrics article {
  padding: 14px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.hero-metrics strong {
  display: block;
  font-size: 22px;
}

.hero-metrics span {
  display: block;
  margin-top: 6px;
  color: var(--wc-text-on-dark-soft);
  font-size: 12px;
}

.hero-dots {
  display: flex;
  gap: 8px;
}

.dot-btn {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
}

.dot-btn.active {
  width: 26px;
  background: linear-gradient(90deg, var(--wc-gold), var(--wc-blue));
}

.surface-stack {
  padding: 18px 12px calc(112px + env(safe-area-inset-bottom));
}

.quick-panel,
.story-block {
  border-radius: var(--wc-radius-xl);
  background: var(--wc-surface-elevated);
  box-shadow: var(--wc-shadow-card);
  border: 1px solid var(--wc-border);
}

.quick-panel {
  padding: 18px;
}

.story-block {
  margin-top: 16px;
  padding: 18px 18px 20px;
}

.section-head {
  align-items: center;
}

.section-head h2 {
  color: var(--wc-text);
  font-size: 24px;
  line-height: 1.24;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.filter-row span {
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-text-soft);
  font-size: 11px;
  font-weight: 700;
}

.quick-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quick-image {
  aspect-ratio: 0.85;
  padding: 8px;
  border-radius: 20px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.quick-card strong,
.quick-card small {
  display: block;
  text-align: center;
}

.quick-card strong {
  color: var(--wc-text);
  font-size: 12px;
  line-height: 1.3;
}

.quick-card small {
  color: var(--wc-text-faint);
  font-size: 11px;
}

.feature-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.feature-card {
  overflow: hidden;
  border-radius: 22px;
  background: var(--wc-card-strong);
  border: 1px solid var(--wc-border);
}

.feature-image {
  min-height: 214px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.feature-copy strong,
.feature-copy small {
  display: block;
}

.feature-copy strong {
  color: var(--wc-text-on-dark);
  font-size: 18px;
}

.feature-copy small {
  margin-top: 6px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.5;
}

@media (min-width: 768px) {
  .home-page {
    background: linear-gradient(180deg, var(--wc-bg) 0 360px, var(--wc-surface) 360px 100%);
  }

  .hero-stage,
  .surface-stack {
    max-width: 980px;
    margin: 0 auto;
  }

  .hero-stage {
    padding: 24px 24px 0;
  }

  .surface-stack {
    padding: 24px 24px 40px;
  }

  .hero-copy h1 {
    max-width: 420px;
    font-size: 44px;
  }
}
</style>
