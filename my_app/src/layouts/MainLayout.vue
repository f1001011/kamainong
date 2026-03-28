<template>
  <div class="main-layout">
    <AppSidebar />
    <main class="main-content">
      <slot />
    </main>
    <AppBottomNav />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'

onMounted(() => {
  document.documentElement.lang = 'zh-CN'
  document.documentElement.dir = 'ltr'
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--wc-surface);
  font-family: 'PingFang SC', 'Microsoft YaHei', Inter, sans-serif;
}

.main-content {
  min-height: 100vh;
  padding-bottom: 104px;
}

@media (min-width: 1100px) {
  .main-content {
    padding-left: 240px;
    padding-bottom: 32px;
  }
}
</style>
