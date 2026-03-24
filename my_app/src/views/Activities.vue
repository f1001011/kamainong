<template>
  <div class="activities-page">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="content">
      <header class="page-header glass-card">
        <button class="icon-btn" @click="router.back()">
          <ChevronLeft :size="18" />
        </button>
        <h1>活动</h1>
        <div class="placeholder"></div>
      </header>

      <section class="activity-list">
        <article v-for="item in activities" :key="item.title" class="activity-card glass-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

const router = useRouter()

const activities = ref([
  { title: 'SVIP1', desc: '个人购买产品两个 Revenu fixe1，每日可领取 50 XAF。' },
  { title: 'LV1月薪奖励', desc: '完成团队业绩要求后可在月薪页面领取奖励。' },
  { title: '代理级别', desc: '代理等级越高，团队收益和奖励额度越高。' },
  { title: '任务组1', desc: '完成 LV2 邀请任务后可获得对应任务奖励。' },
  { title: '任务组2', desc: '完成 LV1 邀请任务后可获得对应任务奖励。' },
])
</script>

<style scoped>
.activities-page {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  padding-bottom: 86px;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red { width: 440px; height: 440px; top: -120px; left: -70px; background: var(--orb-red); }
.orb-cyan { width: 400px; height: 400px; top: 30%; right: -70px; background: var(--orb-cyan); }
.orb-amber { width: 320px; height: 320px; bottom: 6%; left: 15%; background: var(--orb-amber); }

.content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  margin: 0 auto;
  padding: 14px 20px 0;
}

.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

.page-header {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.page-header h1 {
  text-align: center;
  font-size: 16px;
  color: var(--text-primary);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-card {
  padding: 14px;
}

.activity-card h3 {
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 8px;
}

.activity-card p {
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  line-height: 1.7;
}
</style>
