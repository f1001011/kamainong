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
  background:
    radial-gradient(circle at top, rgba(28, 151, 91, 0.16), transparent 24%),
    linear-gradient(180deg, #03180e 0%, #062315 28%, #f2f7f3 28%, #eef4ef 100%);
  font-family: 'PingFang SC', 'Microsoft YaHei', Inter, sans-serif;
}

.main-content {
  min-height: 100vh;
  padding-bottom: 92px;
}

@media (min-width: 768px) {
  .main-content {
    padding-left: 240px;
    padding-bottom: 32px;
  }
}
</style>
