<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import RechargeDesktop from '@/views/main/profile/RechargeDesktop.vue'
import RechargeMobile from '@/views/main/profile/RechargeMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? RechargeDesktop : RechargeMobile))
</script>
