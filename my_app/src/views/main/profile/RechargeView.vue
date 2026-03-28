<template>
  <div class="sub-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <div>
        <p>充值</p>
        <h1>扫码充值</h1>
      </div>
    </header>

    <section class="qr-card">
      <div class="qr-code"></div>
      <strong>世界杯主题收款码</strong>
      <p>请使用支持扫码的应用完成充值。本页为静态演示，后续可直接替换为正式二维码图片。</p>
    </section>

    <section class="tips-card">
      <article v-for="tip in rechargeTips" :key="tip">
        {{ tip }}
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { rechargeTips } from '@/config/worldCup'

const router = useRouter()
</script>

<style scoped>
.sub-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.page-header,
.qr-card,
.tips-card {
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(8, 44, 28, 0.92);
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

.page-header p {
  margin: 0 0 4px;
  color: #9ae6b4;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.page-header h1 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.qr-card {
  margin-top: 16px;
  padding: 24px 20px;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.qr-code {
  width: 220px;
  height: 220px;
  border-radius: 24px;
  background:
    linear-gradient(90deg, transparent 45%, #0b3b23 45%, #0b3b23 55%, transparent 55%),
    linear-gradient(transparent 45%, #0b3b23 45%, #0b3b23 55%, transparent 55%),
    repeating-linear-gradient(0deg, #0b3b23 0 12px, #ffffff 12px 24px),
    repeating-linear-gradient(90deg, #0b3b23 0 12px, #ffffff 12px 24px);
  padding: 16px;
  box-shadow: inset 0 0 0 10px #fff;
}

.qr-card strong {
  margin-top: 18px;
  color: #0d3b23;
  font-size: 22px;
}

.qr-card p {
  margin: 12px 0 0;
  max-width: 280px;
  color: rgba(13, 59, 35, 0.72);
  line-height: 1.7;
}

.tips-card {
  margin-top: 16px;
  padding: 18px;
  display: grid;
  gap: 12px;
  background: linear-gradient(180deg, rgba(8, 44, 28, 0.94), rgba(8, 44, 28, 0.88));
  color: #fff;
}

.tips-card article {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  line-height: 1.7;
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 720px;
    padding: 24px 24px 40px;
  }
}
</style>
