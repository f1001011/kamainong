<template>
  <div class="sports-page">
    <header class="sports-header">
      <button class="back-btn" @click="goBack">‹</button>
      <div>
        <p>体育页</p>
        <h1>赛事承载页</h1>
      </div>
    </header>

    <main class="sports-content">
      <section v-if="iframeUrl" class="frame-shell">
        <div v-if="isLoading" class="frame-mask">
          <strong>正在载入体育内容</strong>
          <p>外部页面加载期间，壳层只保留必要提示，不打断进入主内容。</p>
        </div>
        <iframe :src="iframeUrl" title="体育内容" @load="isLoading = false"></iframe>
      </section>

      <section v-else class="empty-card">
        <strong>暂未配置体育地址</strong>
        <p>先保留为高级承载器样式，后续只需补上 iframe 地址即可切换到正式页面。</p>

        <div class="empty-notes">
          <article v-for="item in highlights" :key="item">{{ item }}</article>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
.sports-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--wc-bg) 0 168px, var(--wc-surface) 168px 100%);
}

.sports-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px 18px;
  background: rgba(11, 31, 23, 0.92);
  backdrop-filter: blur(18px);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--wc-text-on-dark);
  font-size: 28px;
}

.sports-header p {
  margin: 0 0 4px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.sports-header h1 {
  margin: 0;
  color: var(--wc-text-on-dark);
  font-size: 24px;
}

.sports-content {
  padding: 14px 12px calc(112px + env(safe-area-inset-bottom));
}

.frame-shell,
.empty-card {
  border-radius: var(--wc-radius-xl);
  overflow: hidden;
  background: var(--wc-card-strong);
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.frame-shell {
  position: relative;
  min-height: calc(100vh - 250px);
}

.frame-shell iframe {
  display: block;
  width: 100%;
  min-height: calc(100vh - 250px);
  border: 0;
  background: #edf4ef;
}

.frame-mask,
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.frame-mask {
  position: absolute;
  inset: 0;
  gap: 10px;
  padding: 28px;
  background: rgba(251, 248, 241, 0.94);
  z-index: 1;
}

.empty-card {
  min-height: calc(100vh - 250px);
  padding: 30px 24px;
}

.frame-mask strong,
.empty-card strong {
  color: var(--wc-text);
  font-size: 22px;
}

.frame-mask p,
.empty-card p {
  max-width: 320px;
  margin: 10px 0 0;
  color: var(--wc-text-soft);
  line-height: 1.7;
}

.empty-notes {
  width: 100%;
  max-width: 360px;
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.empty-notes article {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(27, 91, 65, 0.06);
  color: var(--wc-text-soft);
  line-height: 1.6;
}

@media (min-width: 768px) {
  .sports-content {
    max-width: 980px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }

  .sports-header {
    padding: 18px 24px;
  }
}
</style>
