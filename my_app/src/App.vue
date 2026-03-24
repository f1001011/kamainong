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
.popup-msg {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
}
</style>
