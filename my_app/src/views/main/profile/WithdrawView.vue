<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import WithdrawDesktop from '@/views/main/profile/WithdrawDesktop.vue'
import WithdrawMobile from '@/views/main/profile/WithdrawMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? WithdrawDesktop : WithdrawMobile))
</script>
