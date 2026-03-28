<template>
  <div class="activities-page">
    <section
      class="poster-card"
      :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 16, 10, 0.16), rgba(2, 16, 10, 0.84)), url(${ACTIVITY_POSTER_IMAGE})` }"
    >
      <div class="glow glow-left"></div>
      <div class="glow glow-right"></div>
      <p class="eyebrow">活动页</p>
      <h1>敬请期待</h1>
      <p class="desc">后续活动、福利与专题将在这里上线，当前先保留世界杯风格占位画面。</p>
      <div class="poster-badge">WORLD CUP</div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ACTIVITY_POSTER_IMAGE } from '@/config/worldCup'
</script>

<style scoped>
.activities-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.poster-card {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 140px);
  border-radius: 32px;
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-position: center;
  background-size: cover;
  color: #fff;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.22);
}

.glow {
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  filter: blur(60px);
}

.glow-left {
  left: -80px;
  top: -40px;
  background: rgba(244, 214, 109, 0.22);
}

.glow-right {
  right: -80px;
  bottom: -40px;
  background: rgba(56, 189, 248, 0.22);
}

.eyebrow {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
  color: #9ae6b4;
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 700;
}

.poster-card h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 44px;
}

.desc {
  position: relative;
  z-index: 1;
  max-width: 300px;
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.8;
}

.poster-badge {
  position: relative;
  z-index: 1;
  margin-top: 24px;
  border-radius: 999px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.12);
  color: #f4d66d;
  font-size: 12px;
  letter-spacing: 0.18em;
  font-weight: 800;
}

@media (min-width: 768px) {
  .activities-page {
    max-width: 960px;
    padding: 24px 24px 40px;
  }
}
</style>
