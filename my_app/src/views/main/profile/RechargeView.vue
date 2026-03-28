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
      <img class="qr-image" :src="RECHARGE_QR_IMAGE" alt="世界杯主题收款码" />
      <strong>世界杯主题收款码</strong>
      <p>先保留静态二维码占位，后续替换真实图片地址即可，不需要大改页面结构。</p>
    </section>

    <section class="tips-card">
      <article v-for="note in rechargeNotes" :key="note">
        {{ note }}
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RECHARGE_QR_IMAGE } from '@/config/worldCup'
import { fetchProfileContent } from '@/services/worldCupContent'

const router = useRouter()
const rechargeNotes = ref<string[]>([])

onMounted(async () => {
  const data = await fetchProfileContent()
  rechargeNotes.value = data.rechargeNotes
})
</script>

<style scoped>
.sub-page {
  min-height: 100vh;
  padding: 12px 12px calc(112px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, var(--wc-bg) 0 160px, var(--wc-surface) 160px 100%);
}

.page-header,
.qr-card,
.tips-card {
  border-radius: var(--wc-radius-xl);
  box-shadow: var(--wc-shadow-card);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(11, 31, 23, 0.94);
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

.page-header p {
  margin: 0 0 4px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.page-header h1 {
  margin: 0;
  color: var(--wc-text-on-dark);
  font-size: 24px;
}

.qr-card {
  margin-top: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--wc-surface-elevated);
  border: 1px solid var(--wc-border);
}

.qr-image {
  width: 220px;
  height: 220px;
  border-radius: 24px;
  object-fit: cover;
  background: #fff;
  box-shadow: inset 0 0 0 12px #ffffff;
}

.qr-card strong {
  margin-top: 18px;
  color: var(--wc-text);
  font-size: 22px;
}

.qr-card p {
  max-width: 300px;
  margin: 12px 0 0;
  color: var(--wc-text-soft);
  line-height: 1.7;
}

.tips-card {
  margin-top: 16px;
  padding: 18px;
  display: grid;
  gap: 12px;
  background: var(--wc-surface-elevated);
  border: 1px solid var(--wc-border);
}

.tips-card article {
  padding: 14px;
  border-radius: 18px;
  background: rgba(27, 91, 65, 0.06);
  color: var(--wc-text-soft);
  line-height: 1.7;
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }
}
</style>
