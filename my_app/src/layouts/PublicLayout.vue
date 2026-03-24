<template>
  <div class="public-layout">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.documentElement.lang = 'ar'
  document.documentElement.dir = 'rtl'
})
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  background: #f6f4ee;
}
</style>
