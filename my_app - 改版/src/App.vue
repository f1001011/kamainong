<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
  <PopupModal v-model="state.visible" v-bind="state.options">
    <p class="popup-msg">{{ state.message }}</p>
  </PopupModal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PopupModal from '@/components/PopupModal.vue'
import { usePopup } from '@/composables/usePopup'
import { useTheme } from '@/composables/useTheme'
import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()
const { state } = usePopup()
useTheme()

const layoutComponent = computed(() => {
  const layout = route.meta.layout as string | undefined
  if (layout === 'auth') return AuthLayout
  if (layout === 'public') return PublicLayout
  return MainLayout
})
</script>

<style>
:root {
  --wc-bg: #0d2319;
  --wc-bg-deep: #091912;
  --wc-bg-soft: #143429;
  --wc-surface: #f3eee3;
  --wc-surface-elevated: #fbf8f1;
  --wc-card: rgba(255, 250, 243, 0.92);
  --wc-card-strong: #ffffff;
  --wc-border: rgba(13, 35, 25, 0.08);
  --wc-border-strong: rgba(13, 35, 25, 0.14);
  --wc-text: #10281f;
  --wc-text-soft: rgba(16, 40, 31, 0.68);
  --wc-text-faint: rgba(16, 40, 31, 0.48);
  --wc-text-on-dark: rgba(255, 251, 245, 0.96);
  --wc-text-on-dark-soft: rgba(255, 251, 245, 0.72);
  --wc-green: #1b5b41;
  --wc-green-soft: #2d7456;
  --wc-gold: #c8a76a;
  --wc-gold-soft: #e7cb94;
  --wc-blue: #7dc4f4;
  --wc-shadow-soft: 0 18px 40px rgba(10, 27, 19, 0.08);
  --wc-shadow-card: 0 22px 56px rgba(10, 27, 19, 0.12);
  --wc-radius-xl: 32px;
  --wc-radius-lg: 24px;
  --wc-radius-md: 18px;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
  background: var(--wc-surface);
}

body {
  overflow-x: hidden;
  color: var(--wc-text);
  font-family: 'PingFang SC', 'Microsoft YaHei', Inter, sans-serif;
}

* {
  box-sizing: border-box;
}

.popup-msg {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
}
</style>
