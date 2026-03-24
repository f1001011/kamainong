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
  document.documentElement.lang = 'ar'
  document.documentElement.dir = 'rtl'
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(13, 107, 61, 0.05), transparent 24%),
    #fafaf7;
}

.main-content {
  min-height: 100vh;
  padding-bottom: 92px;
}

@media (min-width: 768px) {
  .main-content {
    padding-right: 240px;
    padding-bottom: 32px;
  }
}
</style>
