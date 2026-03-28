<template>
  <div class="auth-layout" :class="{ 'auth-layout--desktop': isDesktop }">
    <!-- 背景层 -->
    <div class="auth-video-fallback"></div>
    <div class="auth-overlay auth-overlay-bottom"></div>
    <div class="auth-overlay auth-overlay-top"></div>
    <div class="auth-halo auth-halo-center"></div>
    <div class="auth-halo auth-halo-side"></div>

    <!-- PC 左侧英雄区 -->
    <div v-if="isDesktop" class="auth-pc-left">
      <div class="auth-pc-brand">
        <div class="auth-brand-mark">⚽</div>
        <div class="auth-brand-text">
          <span class="auth-brand-name">世界杯</span>
          <span class="auth-brand-sub">2026 FIFA WORLD CUP</span>
        </div>
      </div>

      <div class="auth-pc-hero">
        <p class="auth-pc-eyebrow">WORLD CUP 2026</p>
        <h1 class="auth-pc-title">见证世界杯<br />的荣耀时刻</h1>
        <p class="auth-pc-copy">
          32 支顶级球队，64 场经典对决，数亿球迷共同见证这场体育盛事的激情与荣耀。
        </p>
      </div>

      <div class="auth-pc-stats">
        <article>
          <strong>32</strong>
          <span>参赛球队</span>
        </article>
        <article>
          <strong>64</strong>
          <span>精彩赛事</span>
        </article>
        <article>
          <strong>5B+</strong>
          <span>全球球迷</span>
        </article>
        <article>
          <strong>16</strong>
          <span>举办城市</span>
        </article>
      </div>
    </div>

    <!-- Mobile 顶部品牌 -->
    <div v-else class="auth-brand">
      <div class="auth-brand-mark">⚽</div>
      <div class="auth-brand-text">
        <span class="auth-brand-name">世界杯</span>
        <span class="auth-brand-sub">2026 FIFA WORLD CUP</span>
      </div>
    </div>

    <!-- 表单区（PC 右侧 / Mobile 底部）-->
    <div :class="isDesktop ? 'auth-pc-right' : 'auth-content'">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useViewportMode } from '@/composables/useViewportMode'

const { isDesktop } = useViewportMode()
</script>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #030303;
}

/* ---------- 背景层（始终绝对定位，跨越全页）---------- */
.auth-video-fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(13, 107, 61, 0.28), transparent 30%),
    radial-gradient(circle at 78% 74%, rgba(200, 167, 106, 0.16), transparent 28%),
    linear-gradient(160deg, #03130c 0%, #061d14 40%, #000 100%);
}

.auth-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.auth-overlay-bottom {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.42) 34%, rgba(0, 0, 0, 0.08) 60%, transparent 100%);
}

.auth-overlay-top {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.14) 0%, transparent 20%);
}

.auth-halo {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(60px);
}

.auth-halo-center {
  left: 50%;
  bottom: -6%;
  width: 580px;
  height: 240px;
  transform: translateX(-50%);
  background: rgba(13, 107, 61, 0.2);
}

.auth-halo-side {
  top: 20%;
  left: -8%;
  width: 220px;
  height: 220px;
  background: rgba(200, 167, 106, 0.16);
}

/* ---------- 共享品牌元素样式 ---------- */
.auth-brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(200, 167, 106, 0.95), rgba(146, 112, 54, 0.95));
  color: #111;
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28);
}

.auth-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.auth-brand-name {
  color: rgba(255, 255, 255, 0.96);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.auth-brand-sub {
  color: rgba(255, 255, 255, 0.44);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

/* ---------- Mobile 顶部品牌 ---------- */
.auth-brand {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

/* ---------- Mobile 底部表单区 ---------- */
.auth-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 120px 20px 28px;
}

/* ---------- PC 双栏布局 ---------- */
.auth-layout--desktop {
  display: grid;
  grid-template-columns: 56% 44%;
}

.auth-pc-left {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 44px 52px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.auth-pc-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-pc-right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 48px;
  background: rgba(0, 0, 0, 0.1);
}

/* ---------- PC 英雄文案 ---------- */
.auth-pc-eyebrow {
  margin: 0 0 18px;
  color: #c8a76a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth-pc-title {
  margin: 0;
  color: #fff;
  font-size: clamp(40px, 4.5vw, 68px);
  line-height: 1.08;
  font-weight: 800;
}

.auth-pc-copy {
  margin: 22px 0 0;
  max-width: 460px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  line-height: 1.9;
}

/* ---------- PC 数据统计 ---------- */
.auth-pc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.auth-pc-stats article {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.auth-pc-stats strong,
.auth-pc-stats span {
  display: block;
}

.auth-pc-stats strong {
  color: #fff;
  font-size: 26px;
  margin-bottom: 6px;
}

.auth-pc-stats span {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
}

@media (max-width: 640px) {
  .auth-brand {
    top: 22px;
  }

  .auth-content {
    padding-top: 100px;
    padding-bottom: 18px;
  }
}
</style>
