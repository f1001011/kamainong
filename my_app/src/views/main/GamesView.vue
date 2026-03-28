<template>
  <div class="games-page">
    <section class="headline-card">
      <p class="eyebrow">游戏专题</p>
      <h1>竞猜、对决、传奇球星都集中放在这一页</h1>
      <p class="lead">页面风格延续首页，但板块定位改成世界杯专题陈列，避免与首页重复。</p>
    </section>

    <section v-for="section in gameSections" :key="section.id" class="topic-section">
      <div
        class="topic-hero"
        :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 16, 10, 0.14), rgba(2, 16, 10, 0.72)), url(${section.heroImage})` }"
      >
        <div class="topic-copy">
          <span>{{ section.accent }}</span>
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>
      </div>

      <div class="topic-grid">
        <article v-for="card in section.cards" :key="card.id" class="topic-card">
          <div class="topic-image" :style="{ backgroundImage: `linear-gradient(180deg, rgba(4, 23, 14, 0), rgba(4, 23, 14, 0.72)), url(${card.imageUrl})` }">
            <span>{{ card.badge }}</span>
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
import { gameSections } from '@/config/worldCup'
</script>

<style scoped>
.games-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.headline-card,
.topic-hero,
.topic-card {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.headline-card {
  padding: 24px 18px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(8, 44, 28, 0.96), rgba(8, 44, 28, 0.88));
  color: #fff;
}

.eyebrow {
  margin: 0 0 10px;
  color: #9ae6b4;
  letter-spacing: 0.12em;
  font-size: 12px;
  font-weight: 700;
}

.headline-card h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
}

.lead {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
}

.topic-section {
  margin-top: 18px;
}

.topic-hero {
  min-height: 220px;
  padding: 18px;
  display: flex;
  align-items: flex-end;
  background-size: cover;
  background-position: center;
}

.topic-copy span,
.topic-image span {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #f4d66d;
  font-size: 12px;
  font-weight: 700;
}

.topic-copy h2 {
  margin: 12px 0 8px;
  color: #fff;
  font-size: 28px;
}

.topic-copy p {
  margin: 0;
  max-width: 320px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.topic-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.topic-card {
  background: rgba(255, 255, 255, 0.8);
}

.topic-image {
  min-height: 210px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-size: cover;
  background-position: center;
}

.topic-image div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topic-image strong {
  color: #fff;
  font-size: 18px;
}

.topic-image small {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.5;
}

@media (min-width: 768px) {
  .games-page {
    max-width: 960px;
    padding: 24px 24px 40px;
  }
}
</style>
