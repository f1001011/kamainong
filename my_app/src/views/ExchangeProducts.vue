<template>
  <div class="exchange-page">
    <div class="bg-canvas">
      <div class="orb orb-amber"></div>
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-content">
      <div class="header">
        <h1>兑换商品</h1>
      </div>

      <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

      <div v-else-if="list.length" class="product-grid">
        <div
          v-for="(item, i) in list"
          :key="item.id"
          class="product-card glass-card"
          v-motion
          :initial="{ opacity: 0, y: 24, scale: 0.92 }"
          :enter="{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(120 + i * 45, 800), type: 'spring', stiffness: 260, damping: 20 } }"
        >
          <div class="product-img">
            <img v-if="item.imageUrl" class="product-img-pic" :src="item.imageUrl" />
            <div v-else class="product-fallback">NO IMAGE</div>
          </div>

          <div class="product-info">
            <div class="product-name">{{ item.name }}</div>
            <div class="product-price">{{ item.price.toLocaleString() }} 积分</div>
            <div class="product-meta">规格: {{ item.spec || '-' }}</div>
          </div>
        </div>
      </div>

      <div v-else class="empty">暂无兑换商品</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchWaresList, type WaresItem } from '@/api/wares'

const { t } = useI18n()

const loading = ref(true)
const list = ref<WaresItem[]>([])

onMounted(async () => {
  try {
    list.value = await fetchWaresList()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.exchange-page {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 20px 20px 80px;
  position: relative;
  overflow: hidden;
}

.page-content {
  position: relative;
  z-index: 1;
}

.bg-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(85px);
  opacity: 0.95;
}

.orb-amber {
  width: 420px;
  height: 420px;
  top: -100px;
  left: -80px;
  background: var(--orb-amber);
}

.orb-cyan {
  width: 360px;
  height: 360px;
  top: 28%;
  right: -60px;
  background: var(--orb-cyan);
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: color-mix(in srgb, var(--text-primary) 50%, transparent);
}

.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid var(--border);
  border-radius: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  overflow: hidden;
}

.product-img {
  position: relative;
  height: 120px;
  background: linear-gradient(160deg, rgba(255, 184, 0, 0.14), rgba(255, 109, 0, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-img-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-fallback {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.product-info {
  padding: 12px 13px 13px;
}

.product-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-amber);
  margin-bottom: 6px;
}

.product-meta {
  font-size: 10px;
  color: color-mix(in srgb, var(--text-primary) 60%, transparent);
  line-height: 1.4;
}
</style>
