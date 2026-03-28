<template>
  <div class="sports-desktop">
    <header
      v-motion
      class="sports-toolbar"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 380 } }"
    >
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="18" />
      </button>

      <div class="toolbar-copy">
        <p>Sports</p>
        <h1>桌面承载页把信息和 iframe 分开处理，重点仍然是尽快进入体育内容。</h1>
      </div>
    </header>

    <main class="sports-stage">
      <aside
        v-motion
        class="info-stack"
        :initial="{ opacity: 0, x: -18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 400, delay: 60 } }"
      >
        <section class="info-card primary-card">
          <div class="status-pill" :class="{ empty: !iframeUrl }">
            <MonitorPlay :size="15" />
            <span>{{ iframeUrl ? '已配置 iframe 地址' : '待配置 iframe 地址' }}</span>
          </div>

          <h2>这页在桌面端更像一个壳层容器，不打断用户进入外部体育主体。</h2>
          <p>
            左侧保留返回、状态和接入说明，右侧把 iframe 作为唯一主区域。以后只需要替换
            `SPORTS_IFRAME_URL`，结构不用重改。
          </p>
        </section>

        <section class="info-card secondary-card">
          <div class="card-head">
            <Trophy :size="18" />
            <strong>接入说明</strong>
          </div>

          <article v-for="item in highlights" :key="item" class="info-note">
            {{ item }}
          </article>
        </section>
      </aside>

      <section
        v-motion
        class="viewer-shell"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 100 } }"
      >
        <template v-if="iframeUrl">
          <div v-if="isLoading" class="viewer-mask">
            <RefreshCw :size="18" />
            <strong>正在加载体育内容</strong>
            <p>iframe 加载时只显示必要状态，不制造多余干扰。</p>
          </div>

          <iframe :src="iframeUrl" title="体育内容" @load="isLoading = false"></iframe>
        </template>

        <div v-else class="empty-state">
          <AlertCircle :size="26" />
          <strong>暂未配置体育地址</strong>
          <p>当前先保留高完成度的桌面承载壳，后续补上正式地址即可接入。</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, ArrowLeft, MonitorPlay, RefreshCw, Trophy } from 'lucide-vue-next'
import { fetchSportsShell } from '@/services/worldCupContent'

const router = useRouter()
const iframeUrl = ref('')
const highlights = ref<string[]>([])
const isLoading = ref(false)

async function loadSportsShell() {
  const data = await fetchSportsShell()
  iframeUrl.value = data.iframeUrl
  highlights.value = data.highlights
  isLoading.value = Boolean(data.iframeUrl)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/')
}

onMounted(() => {
  loadSportsShell()
})
</script>

<style scoped>
.sports-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 240px),
    var(--wc-surface);
}

.sports-toolbar,
.sports-stage {
  max-width: 1400px;
  margin: 0 auto;
}

.sports-toolbar {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.back-btn {
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(11, 31, 23, 0.92);
  color: var(--wc-text-on-dark);
  box-shadow: 0 16px 36px rgba(10, 27, 19, 0.12);
}

.toolbar-copy p {
  margin: 0 0 10px;
  color: var(--wc-green-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.toolbar-copy h1 {
  margin: 0;
  max-width: 860px;
  color: var(--wc-text);
  font-size: 42px;
  line-height: 1.12;
}

.sports-stage {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1.3fr);
  gap: 20px;
}

.info-stack {
  display: grid;
  gap: 18px;
}

.info-card,
.viewer-shell {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.info-card {
  padding: 24px;
}

.primary-card {
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.93));
  color: var(--wc-text-on-dark);
}

.secondary-card {
  background: var(--wc-surface-elevated);
}

.status-pill {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--wc-text-on-dark);
  font-size: 12px;
  font-weight: 700;
}

.status-pill.empty {
  background: rgba(255, 255, 255, 0.08);
  color: var(--wc-gold-soft);
}

.primary-card h2 {
  margin: 18px 0 0;
  color: var(--wc-text-on-dark);
  font-size: 30px;
  line-height: 1.2;
}

.primary-card p {
  margin: 14px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.card-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--wc-text);
}

.info-note {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(27, 91, 65, 0.06);
  color: var(--wc-text-soft);
  line-height: 1.65;
}

.viewer-shell {
  position: relative;
  min-height: calc(100vh - 210px);
  overflow: hidden;
  background: var(--wc-card-strong);
}

.viewer-shell iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 210px);
  border: 0;
  background: #edf4ef;
}

.viewer-mask,
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  text-align: center;
}

.viewer-mask {
  z-index: 1;
  background: rgba(251, 248, 241, 0.95);
  color: var(--wc-text);
}

.viewer-mask p,
.empty-state p {
  max-width: 420px;
  margin: 0;
  color: var(--wc-text-soft);
  line-height: 1.7;
}

.empty-state {
  position: static;
  min-height: calc(100vh - 210px);
  color: var(--wc-text);
}

.empty-state strong,
.viewer-mask strong {
  font-size: 24px;
}
</style>
