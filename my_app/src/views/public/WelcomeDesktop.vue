<template>
  <div class="welcome-desktop">
    <!-- 顶部导航 -->
    <header class="wd-nav" :class="{ elevated: scrolled }">
      <div class="wd-brand">
        <div class="wd-brand-mark">⚽</div>
        <span>世界杯</span>
      </div>

      <nav class="wd-links">
        <button v-for="item in navLinks" :key="item.href" @click="scrollTo(item.href)">
          {{ item.label }}
        </button>
      </nav>

      <div class="wd-actions">
        <button class="wd-ghost-btn" @click="router.push('/login')">登录</button>
        <button class="wd-solid-btn" @click="router.push('/register')">免费注册</button>
      </div>
    </header>

    <!-- 英雄区 -->
    <section
      id="hero"
      class="wd-hero"
      :style="{ backgroundImage: `linear-gradient(140deg, rgba(3,22,14,0.94), rgba(13,107,61,0.82)), url(${heroImage})` }"
    >
      <div class="wd-hero-backdrop"></div>
      <div class="wd-hero-content">
        <p class="wd-eyebrow">WORLD CUP 2026</p>
        <h1>见证世界杯的荣耀时刻</h1>
        <p class="wd-hero-copy">
          32 支顶级球队同台竞技，64 场经典对决分秒必争，数亿球迷跨越国界共同见证这场全球体育盛事。
        </p>
        <div class="wd-hero-actions">
          <button class="wd-solid-btn large" @click="router.push('/login')">立即登录</button>
          <button class="wd-ghost-btn light large" @click="scrollTo('#features')">探索内容</button>
        </div>
      </div>
      <div class="wd-hero-stats">
        <article v-for="stat in stats" :key="stat.label" class="wd-stat-card">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </article>
      </div>
    </section>

    <!-- 关于 -->
    <section id="about" class="wd-story content-shell">
      <div>
        <p class="wd-section-kicker">关于平台</p>
        <h2>世界级赛事，一站式内容体验</h2>
      </div>
      <p>
        我们专注于为全球球迷提供最深度的世界杯内容体验，从赛程数据到球星风采，从经典回顾到实时直播，
        用精心策划的内容陪伴每一位球迷走过这段荣耀旅程。
      </p>
    </section>

    <!-- 核心功能 -->
    <section id="features" class="wd-features content-shell">
      <div class="wd-section-head">
        <p class="wd-section-kicker">核心内容</p>
        <h2>三大专区，全程覆盖</h2>
      </div>
      <div class="wd-features-grid">
        <article v-for="feat in features" :key="feat.title" class="wd-feature-card">
          <div class="wd-feature-icon">{{ feat.icon }}</div>
          <h3>{{ feat.title }}</h3>
          <p>{{ feat.desc }}</p>
        </article>
      </div>
    </section>

    <!-- 精选赛事 -->
    <section id="matches" class="wd-matches content-shell">
      <div class="wd-section-head">
        <p class="wd-section-kicker">精选赛事</p>
        <h2>不容错过的经典对决</h2>
      </div>
      <div class="wd-matches-grid">
        <article v-for="match in matches" :key="match.title" class="wd-match-card">
          <div class="wd-match-image" :style="{ backgroundImage: `url(${match.image})` }"></div>
          <div class="wd-match-body">
            <span class="wd-match-tag">{{ match.category }}</span>
            <h3>{{ match.title }}</h3>
            <p>{{ match.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- CTA -->
    <section id="join" class="wd-cta content-shell">
      <div>
        <p class="wd-section-kicker">立即开始</p>
        <h2>加入全球数亿球迷的行列</h2>
      </div>
      <div class="wd-cta-actions">
        <button class="wd-solid-btn large" @click="router.push('/register')">免费注册</button>
        <button class="wd-ghost-btn dark large" @click="router.push('/login')">已有账号，登录</button>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scrolled = ref(false)
const heroImage = '/worldcup/welcome/welcome-hero.svg'

const navLinks = [
  { label: '首页', href: '#hero' },
  { label: '关于', href: '#about' },
  { label: '内容', href: '#features' },
  { label: '赛事', href: '#matches' },
  { label: '加入', href: '#join' },
]

const stats = [
  { value: '32', label: '参赛球队' },
  { value: '64', label: '精彩赛事' },
  { value: '5B+', label: '全球球迷' },
  { value: '16', label: '举办城市' },
]

const features = [
  { icon: '🏆', title: '赛事直播', desc: '覆盖全部 64 场赛事，高清直播与实时数据同步，不错过每一个精彩瞬间。' },
  { icon: '📊', title: '球队数据', desc: '32 支参赛球队完整数据库，深度分析赛前对阵形势与赛后关键表现。' },
  { icon: '⭐', title: '球星风采', desc: '追踪顶级球星最新动态，感受世界杯舞台上的明星魅力与传奇故事。' },
]

const matches = [
  {
    title: '世界波之夜',
    category: '经典回顾',
    desc: '那些改变比赛走向的惊天世界波，逐帧重温足球的纯粹之美。',
    image: '/worldcup/welcome/welcome-project-01.svg',
  },
  {
    title: '金杯巡礼',
    category: '荣耀历程',
    desc: '跟随大力神杯走过 32 支球队的晋级之路，感受每一步的重量。',
    image: '/worldcup/welcome/welcome-project-02.svg',
  },
  {
    title: '传奇对决',
    category: '顶级赛事',
    desc: '历史上那些让全球球迷屏息的终极对决，每一分钟都是经典。',
    image: '/worldcup/welcome/welcome-project-03.svg',
  },
]

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleScroll() {
  scrolled.value = window.scrollY > 40
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
.welcome-desktop {
  color: var(--wc-text);
}

/* ---------- 导航 ---------- */
.wd-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 36px;
  transition: all 0.25s ease;
}

.wd-nav.elevated {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.wd-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 19px;
  font-weight: 700;
}

.wd-nav.elevated .wd-brand {
  color: var(--wc-text);
}

.wd-brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c8a76a, #8f6c3a);
  font-size: 18px;
}

.wd-links,
.wd-actions,
.wd-hero-actions,
.wd-cta-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wd-links button {
  padding: 10px 14px;
  border-radius: 999px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font: inherit;
}

.wd-nav.elevated .wd-links button {
  color: var(--wc-text-soft);
}

.wd-ghost-btn,
.wd-solid-btn {
  border: 0;
  cursor: pointer;
  font: inherit;
  border-radius: 999px;
  padding: 12px 20px;
  font-weight: 700;
}

.wd-ghost-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.wd-ghost-btn.light {
  background: rgba(255, 255, 255, 0.18);
}

.wd-ghost-btn.dark {
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-green);
}

.wd-solid-btn {
  background: linear-gradient(135deg, var(--wc-green), var(--wc-green-soft));
  color: #fff;
  box-shadow: 0 12px 30px rgba(13, 107, 61, 0.2);
}

.large {
  padding: 15px 28px;
}

/* ---------- 英雄区 ---------- */
.wd-hero {
  position: relative;
  min-height: 100vh;
  padding: 120px 36px 56px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 28px;
  align-items: end;
  background-position: center;
  background-size: cover;
}

.wd-hero-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(200, 167, 106, 0.14), transparent 30%);
}

.wd-hero-content,
.wd-hero-stats {
  position: relative;
  z-index: 1;
}

.wd-eyebrow,
.wd-section-kicker {
  margin-bottom: 14px;
  color: var(--wc-gold);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
}

.wd-hero-content h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 1.04;
}

.wd-hero-copy {
  margin: 20px 0 0;
  max-width: 600px;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.9;
  font-size: 17px;
}

.wd-hero-actions {
  margin-top: 32px;
}

.wd-hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.wd-stat-card {
  padding: 22px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  color: #fff;
}

.wd-stat-card strong {
  display: block;
  font-size: 34px;
  margin-bottom: 8px;
}

.wd-stat-card span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}

/* ---------- 内容区公共 ---------- */
.content-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 92px 36px;
}

/* ---------- 关于 ---------- */
.wd-story {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 28px;
  margin-top: -52px;
  border-radius: var(--wc-radius-xl);
  background: var(--wc-surface-elevated);
  box-shadow: var(--wc-shadow-card);
}

.wd-story h2 {
  margin: 0;
  color: var(--wc-text);
  font-size: clamp(28px, 3.5vw, 44px);
}

.wd-story > p {
  color: var(--wc-text-soft);
  line-height: 1.9;
  font-size: 16px;
}

/* ---------- 功能区 ---------- */
.wd-section-head h2 {
  margin: 0;
  color: var(--wc-text);
  font-size: clamp(28px, 3.5vw, 44px);
}

.wd-features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.wd-feature-card {
  padding: 28px;
  border-radius: var(--wc-radius-lg);
  background: linear-gradient(180deg, var(--wc-card-strong), var(--wc-surface));
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-soft);
}

.wd-feature-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(200, 167, 106, 0.18), rgba(27, 91, 65, 0.1));
  font-size: 22px;
}

.wd-feature-card h3 {
  margin: 0 0 10px;
  font-size: 22px;
  color: var(--wc-text);
}

.wd-feature-card p {
  color: var(--wc-text-soft);
  line-height: 1.85;
  font-size: 15px;
  margin: 0;
}

/* ---------- 精选赛事 ---------- */
.wd-matches-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.wd-match-card {
  overflow: hidden;
  border-radius: var(--wc-radius-lg);
  background: var(--wc-card-strong);
  box-shadow: var(--wc-shadow-card);
}

.wd-match-image {
  height: 220px;
  background-size: cover;
  background-position: center;
  background-color: var(--wc-bg-soft);
}

.wd-match-body {
  padding: 22px;
}

.wd-match-tag {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-green);
  font-size: 12px;
  font-weight: 700;
}

.wd-match-body h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--wc-text);
}

.wd-match-body p {
  margin: 0;
  color: var(--wc-text-soft);
  line-height: 1.8;
  font-size: 14px;
}

/* ---------- CTA ---------- */
.wd-cta {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  margin-bottom: 72px;
  border-radius: var(--wc-radius-xl);
  background: linear-gradient(135deg, var(--wc-bg), var(--wc-green));
  align-items: center;
}

.wd-cta .wd-section-kicker {
  color: var(--wc-gold-soft);
}

.wd-cta h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(24px, 3vw, 40px);
}
</style>
