<template>
  <div class="worldcup-page">
    <section class="hero">
      <div
        class="hero-banner"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 16, 10, 0.18), rgba(2, 16, 10, 0.7)), url(${activeBanner.imageUrl})` }"
      >
        <div class="hero-top">
          <div>
            <p class="eyebrow">世界杯主题 H5</p>
            <h1>{{ activeBanner.title }}</h1>
            <p class="hero-copy">{{ activeBanner.subtitle }}</p>
          </div>
          <span class="hero-tag">{{ activeBanner.tag }}</span>
        </div>

        <div class="hero-bottom">
          <div class="hero-metrics">
            <div>
              <strong>32</strong>
              <span>参赛球队</span>
            </div>
            <div>
              <strong>64</strong>
              <span>赛事故事</span>
            </div>
            <div>
              <strong>24H</strong>
              <span>球迷热度</span>
            </div>
          </div>
          <div class="hero-dots">
            <button
              v-for="(banner, index) in homeBanners"
              :key="banner.id"
              class="dot-btn"
              :class="{ active: index === bannerIndex }"
              @click="bannerIndex = index"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <section class="gallery-panel">
      <div class="section-head">
        <div>
          <p>世界杯画廊</p>
          <h2>先用 4 列图片铺满首页节奏</h2>
        </div>
        <span>图片优先</span>
      </div>

      <div class="quick-grid">
        <article v-for="card in homeQuickGallery" :key="card.id" class="quick-card">
          <div class="quick-image" :style="{ backgroundImage: `url(${card.imageUrl})` }">
            <span>{{ card.badge }}</span>
          </div>
          <strong>{{ card.title }}</strong>
        </article>
      </div>
    </section>

    <section v-for="section in homeSections" :key="section.id" class="content-section">
      <div class="section-head">
        <div>
          <p>{{ section.title }}</p>
          <h2>{{ section.subtitle }}</h2>
        </div>
      </div>

      <div class="feature-grid">
        <article v-for="card in section.cards" :key="card.id" class="feature-card">
          <div class="feature-image" :style="{ backgroundImage: `linear-gradient(180deg, rgba(4, 23, 14, 0), rgba(4, 23, 14, 0.75)), url(${card.imageUrl})` }">
            <span v-if="card.badge">{{ card.badge }}</span>
            <div>
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
import { homeBanners, homeQuickGallery, homeSections } from '@/config/worldCup'

const bannerIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const activeBanner = computed(() => homeBanners[bannerIndex.value] ?? homeBanners[0])

function startAutoPlay() {
  stopAutoPlay()
  timer = setInterval(() => {
    bannerIndex.value = (bannerIndex.value + 1) % homeBanners.length
  }, 4000)
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.worldcup-page {
  min-height: 100vh;
  padding: 8px 10px 110px;
  color: #f4faf6;
}

.hero-banner,
.gallery-panel,
.feature-card {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
}

.hero-banner {
  min-height: 280px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow,
.section-head p {
  margin: 0 0 10px;
  font-size: 12px;
  color: #9ae6b4;
  letter-spacing: 0.12em;
}

.hero h1,
.section-head h2 {
  margin: 0;
  line-height: 1.15;
}

.hero h1 {
  max-width: 240px;
  font-size: 32px;
}

.hero-copy {
  max-width: 290px;
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.hero-tag,
.section-head span,
.quick-image span,
.feature-image span {
  align-self: flex-start;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #f4d66d;
  backdrop-filter: blur(12px);
  font-size: 12px;
  font-weight: 700;
}

.hero-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-metrics div {
  padding: 14px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.hero-metrics strong {
  display: block;
  font-size: 22px;
}

.hero-metrics span {
  display: block;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.hero-dots {
  display: flex;
  gap: 8px;
}

.dot-btn {
  width: 10px;
  height: 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
}

.dot-btn.active {
  width: 28px;
  background: linear-gradient(90deg, #f4d66d, #38bdf8);
}

.gallery-panel,
.content-section {
  margin-top: 18px;
}

.gallery-panel {
  padding: 18px;
  background: linear-gradient(180deg, rgba(7, 38, 24, 0.95), rgba(7, 38, 24, 0.88));
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.section-head h2 {
  color: #f9fffb;
  font-size: 22px;
}

.quick-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.quick-card strong {
  display: block;
  margin-top: 8px;
  color: #f6fff9;
  font-size: 12px;
  text-align: center;
}

.quick-image {
  aspect-ratio: 0.88;
  border-radius: 18px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8px;
}

.feature-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.06);
}

.feature-image {
  min-height: 210px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.feature-image div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-image strong {
  color: #fff;
  font-size: 18px;
}

.feature-image small {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

@media (min-width: 768px) {
  .worldcup-page {
    max-width: 960px;
    padding: 24px 24px 40px;
  }

  .hero h1 {
    max-width: 420px;
    font-size: 42px;
  }
}
</style>
