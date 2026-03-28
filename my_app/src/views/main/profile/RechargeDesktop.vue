<template>
  <div class="recharge-desktop">
    <section
      v-motion
      class="hero-panel"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="18" />
      </button>

      <div class="hero-copy">
        <p>Recharge</p>
        <h1>桌面端把充值页做成“主二维码 + 说明侧栏”，不再只是手机页纵向堆叠。</h1>
        <span>二维码素材仍然来自本地固定目录，后续你直接替换图片文件即可。</span>
      </div>
    </section>

    <section class="content-grid">
      <section
        v-motion
        class="qr-panel"
        :initial="{ opacity: 0, x: -18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 70 } }"
      >
        <div class="qr-shell">
          <img class="qr-image" :src="RECHARGE_QR_IMAGE" alt="世界杯主题收款码" />
        </div>
        <strong>世界杯主题收款码</strong>
        <p>当前为静态演示二维码，接真实支付时仅替换图片资源即可。</p>
      </section>

      <aside
        v-motion
        class="notes-panel"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 100 } }"
      >
        <div class="notes-head">
          <QrCode :size="18" />
          <strong>接入说明</strong>
        </div>

        <article v-for="note in rechargeNotes" :key="note" class="note-item">
          {{ note }}
        </article>

        <div class="path-card">
          <small>二维码文件位置</small>
          <strong>/public/worldcup/profile/recharge-qr.svg</strong>
        </div>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, QrCode } from 'lucide-vue-next'
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
.recharge-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 240px),
    var(--wc-surface);
}

.hero-panel,
.content-grid {
  max-width: 1400px;
  margin: 0 auto;
}

.hero-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: flex-start;
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

.hero-copy p {
  margin: 0 0 10px;
  color: var(--wc-green-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  max-width: 820px;
  color: var(--wc-text);
  font-size: 42px;
  line-height: 1.12;
}

.hero-copy span {
  display: block;
  margin-top: 14px;
  color: var(--wc-text-soft);
  line-height: 1.7;
}

.content-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
  gap: 20px;
}

.qr-panel,
.notes-panel {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.qr-panel {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--wc-surface-elevated);
}

.qr-shell {
  padding: 18px;
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), rgba(11, 31, 23, 0.02)),
    #ffffff;
  box-shadow: inset 0 0 0 1px rgba(13, 35, 25, 0.06);
}

.qr-image {
  width: min(100%, 360px);
  max-width: 360px;
  aspect-ratio: 1;
  border-radius: 24px;
  object-fit: cover;
  background: #fff;
}

.qr-panel strong {
  margin-top: 22px;
  color: var(--wc-text);
  font-size: 28px;
}

.qr-panel p {
  max-width: 420px;
  margin: 12px 0 0;
  color: var(--wc-text-soft);
  line-height: 1.75;
}

.notes-panel {
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.93));
  color: var(--wc-text-on-dark);
}

.notes-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.note-item {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}

.path-card {
  margin-top: 18px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.path-card small,
.path-card strong {
  display: block;
}

.path-card small {
  color: var(--wc-text-on-dark-soft);
  font-size: 12px;
}

.path-card strong {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
}
</style>
