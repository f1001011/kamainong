<template>
  <div class="games-page">
    <section
      v-motion
      class="games-hero"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
    >
      <p class="eyebrow">游戏页</p>
      <h1>更像内容池，而不是第二个首页</h1>
      <p class="lead">这里把专题内容按板块稳定展开，方便用户快速扫图和切换注意力。</p>
    </section>

    <section
      v-for="(section, index) in sections"
      :key="section.id"
      v-motion
      class="topic-section"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 500, delay: 80 + index * 80 } }"
    >
      <div
        class="topic-hero"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.06), rgba(8, 22, 15, 0.72)), url(${section.heroImage})` }"
      >
        <div class="topic-copy">
          <span>{{ section.accent }}</span>
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>
      </div>

      <div class="topic-rail">
        <article v-for="card in section.cards" :key="card.id" class="topic-card">
          <div
            class="topic-image"
            :style="{ backgroundImage: `linear-gradient(180deg, rgba(8, 22, 15, 0.02), rgba(8, 22, 15, 0.7)), url(${card.imageUrl})` }"
          >
            <MiniTagBadge v-if="card.badge" :label="card.badge" />
            <div class="topic-card-copy">
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
.games-page {
  min-height: 100vh;
  padding: 12px 12px calc(112px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(11, 31, 23, 0.08), transparent 220px), var(--wc-surface);
}

.games-hero,
.topic-section {
  border-radius: var(--wc-radius-xl);
  box-shadow: var(--wc-shadow-card);
  border: 1px solid var(--wc-border);
}

.games-hero {
  padding: 22px 18px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.2), transparent 24%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.96), rgba(20, 52, 41, 0.92));
  color: var(--wc-text-on-dark);
}

.eyebrow {
  margin: 0 0 12px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.games-hero h1 {
  margin: 0;
  max-width: 280px;
  font-size: 32px;
  line-height: 1.12;
}

.lead {
  max-width: 330px;
  margin: 12px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}

.topic-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--wc-surface-elevated);
}

.topic-hero {
  min-height: 200px;
  padding: 18px;
  border-radius: var(--wc-radius-lg);
  display: flex;
  align-items: flex-end;
  background-size: cover;
  background-position: center;
}

.topic-copy span {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--wc-gold-soft);
  font-size: 11px;
  font-weight: 700;
}

.topic-copy h2 {
  margin: 12px 0 8px;
  color: var(--wc-text-on-dark);
  font-size: 30px;
}

.topic-copy p {
  max-width: 320px;
  margin: 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}

.topic-rail {
  margin-top: 14px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 72%;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
}

.topic-rail::-webkit-scrollbar {
  display: none;
}

.topic-card {
  scroll-snap-align: start;
  overflow: hidden;
  border-radius: 22px;
  background: var(--wc-card-strong);
  border: 1px solid var(--wc-border);
}

.topic-image {
  min-height: 220px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.topic-card-copy strong,
.topic-card-copy small {
  display: block;
}

.topic-card-copy strong {
  color: var(--wc-text-on-dark);
  font-size: 18px;
}

.topic-card-copy small {
  margin-top: 6px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.5;
}

@media (min-width: 768px) {
  .games-page {
    max-width: 980px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }

  .topic-rail {
    grid-auto-columns: calc((100% - 24px) / 3);
    overflow: visible;
  }

  .games-hero h1 {
    max-width: 420px;
    font-size: 42px;
  }
}
</style>
