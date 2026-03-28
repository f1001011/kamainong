<template>
  <div class="sports-page">
    <header class="sports-header">
      <button class="back-btn" @click="goBack">‹</button>
      <div>
        <p>体育页</p>
        <h1>赛事直播视图</h1>
      </div>
    </header>

    <main class="sports-content">
      <section class="tips-card">
        <span v-for="item in sportsHighlights" :key="item">{{ item }}</span>
      </section>

      <section v-if="SPORTS_IFRAME_URL" class="iframe-shell">
        <div v-if="isLoading" class="iframe-mask">
          <strong>页面加载中...</strong>
          <p>正在接入外部体育页面，请稍候。</p>
        </div>
        <iframe :src="SPORTS_IFRAME_URL" title="体育内容" @load="isLoading = false"></iframe>
      </section>

      <section v-else class="empty-card">
        <strong>暂未配置体育 iframe 地址</strong>
        <p>请在 `src/config/worldCup.ts` 中更新 `SPORTS_IFRAME_URL`，即可切换到正式外部页面。</p>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SPORTS_IFRAME_URL, sportsHighlights } from '@/config/worldCup'

const router = useRouter()
const isLoading = ref(Boolean(SPORTS_IFRAME_URL))

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/')
}
</script>

<style scoped>
.sports-page {
  min-height: 100vh;
  padding-bottom: 110px;
}

.sports-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 14px;
  background: rgba(3, 24, 14, 0.92);
  backdrop-filter: blur(18px);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 28px;
}

.sports-header p {
  margin: 0 0 4px;
  color: #9ae6b4;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.sports-header h1 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.sports-content {
  padding: 14px;
}

.tips-card,
.iframe-shell,
.empty-card {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.tips-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(8, 44, 28, 0.94), rgba(8, 44, 28, 0.84));
}

.tips-card span {
  color: #f4faf6;
  line-height: 1.6;
}

.iframe-shell,
.empty-card {
  margin-top: 14px;
  min-height: calc(100vh - 260px);
  background: #fff;
}

.iframe-shell {
  position: relative;
}

.iframe-shell iframe {
  display: block;
  width: 100%;
  min-height: calc(100vh - 260px);
  border: 0;
  background: #eff5f0;
}

.iframe-mask,
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}

.iframe-mask {
  position: absolute;
  inset: 0;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  z-index: 1;
}

.iframe-mask strong,
.empty-card strong {
  color: #0d3b23;
  font-size: 20px;
}

.iframe-mask p,
.empty-card p {
  max-width: 280px;
  margin: 0;
  color: rgba(13, 59, 35, 0.74);
  line-height: 1.7;
}

@media (min-width: 768px) {
  .sports-content {
    max-width: 960px;
    padding: 20px 24px 40px;
  }
}
</style>
