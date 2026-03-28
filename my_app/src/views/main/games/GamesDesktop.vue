<template>
  <div class="games-desktop">
    <section
      v-motion
      class="page-hero"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
    >
      <div>
        <p class="eyebrow">Games</p>
        <h1>游戏页在桌面端改成稳定的专题目录，不再像移动端长流式滑动。</h1>
      </div>

      <div class="hero-side">
        <p>每个板块保留独立英雄图、说明文案和 3 张核心卡片，方便 PC 上快速扫过内容池。</p>
        <div class="hero-tags">
          <span v-for="section in sections" :key="section.id">{{ section.title }}</span>
        </div>
      </div>
    </section>

    <section
      v-for="(section, index) in sections"
      :key="section.id"
      v-motion
      class="catalog-section"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 420, delay: 80 + index * 90 } }"
    >
      <aside
        class="catalog-meta"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.12), rgba(8, 22, 15, 0.84)), url(${section.heroImage})` }"
      >
        <span class="meta-pill">{{ section.accent }}</span>
        <h2>{{ section.title }}</h2>
        <p>{{ section.description }}</p>
      </aside>

      <div class="catalog-grid">
        <article v-for="card in section.cards" :key="card.id" class="catalog-card">
          <div
            class="catalog-image"
            :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.04), rgba(8, 22, 15, 0.74)), url(${card.imageUrl})` }"
          >
            <MiniTagBadge v-if="card.badge" :label="card.badge" />
            <div class="catalog-copy">
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
import { onMounted, ref } from 'vue'
import MiniTagBadge from '@/components/ui/MiniTagBadge.vue'
import { fetchGamesContent } from '@/services/worldCupContent'
import type { GameSection } from '@/config/worldCup'

const sections = ref<GameSection[]>([])

onMounted(async () => {
  const data = await fetchGamesContent()
  sections.value = data.sections
})
</script>

<style scoped>
.games-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 240px),
    var(--wc-surface);
}

.page-hero,
.catalog-section {
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.page-hero {
  padding: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 24px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.92));
  color: var(--wc-text-on-dark);
}

.eyebrow {
  margin: 0 0 14px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.page-hero h1 {
  margin: 0;
  max-width: 780px;
  font-size: 48px;
  line-height: 1.08;
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: space-between;
}

.hero-side p {
  margin: 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-tags span {
  border-radius: 999px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--wc-text-on-dark);
  font-size: 12px;
  font-weight: 700;
}

.catalog-section {
  margin-top: 24px;
  padding: 22px;
  display: grid;
  grid-template-columns: minmax(300px, 0.78fr) minmax(0, 1.22fr);
  gap: 18px;
  background: var(--wc-surface-elevated);
}

.catalog-meta,
.catalog-card {
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--wc-border);
}

.catalog-meta {
  min-height: 360px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-size: cover;
  background-position: center;
}

.meta-pill {
  width: fit-content;
  margin-bottom: 14px;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--wc-gold-soft);
  font-size: 12px;
  font-weight: 700;
}

.catalog-meta h2 {
  margin: 0;
  color: var(--wc-text-on-dark);
  font-size: 36px;
}

.catalog-meta p {
  max-width: 340px;
  margin: 12px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.catalog-card {
  background: var(--wc-card-strong);
}

.catalog-image {
  min-height: 360px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.catalog-copy strong,
.catalog-copy small {
  display: block;
}

.catalog-copy strong {
  color: var(--wc-text-on-dark);
  font-size: 20px;
}

.catalog-copy small {
  margin-top: 8px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.55;
}
</style>
