<template>
  <div class="investments-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-scroll">
      <header class="page-header">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft :size="18" />
        </button>
        <h1 class="page-title">我的投资</h1>
        <div style="width:40px"></div>
      </header>

      <div v-if="loading" class="loading-state">
        <Loader2 :size="32" class="spinner" />
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <Package :size="48" class="empty-icon" />
        <div class="empty-text">暂无投资记录</div>
        <button class="go-btn" @click="router.push('/products')">去投资</button>
      </div>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const investments = ref([])

onMounted(async () => {
  // API调用
  investments.value = []
})
</script>

<style scoped>
.my-investments {
  padding: 20px;
}

.investment-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}
</style>
