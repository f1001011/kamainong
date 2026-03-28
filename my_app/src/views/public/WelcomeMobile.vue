<template>
  <div class="welcome-mobile">
    <!-- 顶部导航 -->
    <header class="wm-nav" :class="{ elevated: scrolled }">
      <div class="wm-brand">
        <div class="wm-brand-mark">⚽</div>
        <span>世界杯</span>
      </div>
      <div class="wm-nav-actions">
        <button class="wm-ghost-btn" @click="router.push('/login')">登录</button>
        <button class="wm-solid-btn" @click="router.push('/register')">注册</button>
      </div>
    </header>

    <!-- 英雄区 -->
    <section
      class="wm-hero"
      :style="{ backgroundImage: `linear-gradient(160deg, rgba(3,22,14,0.95), rgba(13,107,61,0.85)), url(${heroImage})` }"
    >
      <p class="wm-eyebrow">WORLD CUP 2026</p>
      <h1>见证世界杯的荣耀时刻</h1>
      <p class="wm-hero-copy">32 支顶级球队，64 场经典对决，数亿球迷共同见证这场体育盛事。</p>
      <div class="wm-hero-actions">
        <button class="wm-solid-btn large" @click="router.push('/login')">立即登录</button>
        <button class="wm-ghost-btn light large" @click="router.push('/register')">免费注册</button>
      </div>
      <div class="wm-stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="wm-stat">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="wm-features">
      <p class="wm-section-kicker">核心内容</p>
      <h2>三大专区，全程陪你</h2>
      <div class="wm-feature-list">
        <div v-for="feat in features" :key="feat.title" class="wm-feature-card">
          <div class="wm-feature-icon">{{ feat.icon }}</div>
          <div class="wm-feature-copy">
            <h3>{{ feat.title }}</h3>
            <p>{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="wm-cta">
      <p class="wm-section-kicker">立即开始</p>
      <h2>加入全球球迷的行列</h2>
      <button class="wm-solid-btn large full" @click="router.push('/register')">免费注册</button>
      <button class="wm-ghost-btn light-cta large full" @click="router.push('/login')">已有账号，登录</button>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scrolled = ref(false)
const heroImage = '/worldcup/welcome/welcome-hero.svg'

const stats = [
  { value: '32', label: '参赛球队' },
  { value: '64', label: '精彩赛事' },
  { value: '5B+', label: '全球球迷' },
  { value: '16', label: '举办城市' },
]

const features = [
  { icon: '🏆', title: '赛事直播', desc: '覆盖全部 64 场赛事，高清直播不错过每一个精彩瞬间。' },
  { icon: '📊', title: '球队数据', desc: '32 支参赛球队完整数据，深度分析赛前赛后表现。' },
  { icon: '⭐', title: '球星风采', desc: '追踪顶级球星最新动态，感受世界杯的明星魅力。' },
]

function handleScroll() {
  scrolled.value = window.scrollY > 40
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
.welcome-mobile {
  color: var(--wc-text);
  background: var(--wc-surface);
}

/* ---------- 导航 ---------- */
.wm-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  transition: all 0.25s ease;
}

.wm-nav.elevated {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.wm-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.wm-nav.elevated .wm-brand {
  color: var(--wc-text);
}

.wm-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c8a76a, #8f6c3a);
  font-size: 16px;
}

.wm-nav-actions {
  display: flex;
  gap: 8px;
}

.wm-ghost-btn,
.wm-solid-btn {
  border: 0;
  cursor: pointer;
  font: inherit;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
}

.wm-ghost-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.wm-ghost-btn.light {
  background: rgba(255, 255, 255, 0.18);
}

.wm-ghost-btn.light-cta {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
}

.wm-solid-btn {
  background: linear-gradient(135deg, var(--wc-green), var(--wc-green-soft));
  color: #fff;
}

.large {
  padding: 14px 22px;
  font-size: 15px;
}

.full {
  width: 100%;
}

/* ---------- 英雄区 ---------- */
.wm-hero {
  padding: 90px 16px 36px;
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.wm-eyebrow,
.wm-section-kicker {
  margin: 0 0 12px;
  color: var(--wc-gold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.wm-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(32px, 8vw, 48px);
  line-height: 1.12;
}

.wm-hero-copy {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.85;
  font-size: 15px;
}

.wm-hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 10px;
}

.wm-stats-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.wm-stat {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: #fff;
}

.wm-stat strong,
.wm-stat span {
  display: block;
}

.wm-stat strong {
  font-size: 26px;
  margin-bottom: 4px;
}

.wm-stat span {
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
}

/* ---------- 功能区 ---------- */
.wm-features {
  padding: 40px 16px;
}

.wm-features h2 {
  margin: 0 0 22px;
  font-size: 26px;
  color: var(--wc-text);
}

.wm-feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wm-feature-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: var(--wc-radius-md);
  background: var(--wc-card-strong);
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-soft);
}

.wm-feature-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(200, 167, 106, 0.18), rgba(27, 91, 65, 0.1));
  font-size: 20px;
}

.wm-feature-copy h3 {
  margin: 0 0 6px;
  font-size: 17px;
  color: var(--wc-text);
}

.wm-feature-copy p {
  margin: 0;
  color: var(--wc-text-soft);
  font-size: 14px;
  line-height: 1.75;
}

/* ---------- CTA ---------- */
.wm-cta {
  padding: 36px 16px 52px;
  background: linear-gradient(180deg, var(--wc-bg-soft), var(--wc-bg));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wm-cta h2 {
  margin: 0 0 4px;
  font-size: 24px;
  color: #fff;
}

.wm-cta .wm-section-kicker {
  color: var(--wc-gold-soft);
}
</style>
