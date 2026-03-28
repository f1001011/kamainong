<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import SportsDesktop from '@/views/main/sports/SportsDesktop.vue'
import SportsMobile from '@/views/main/sports/SportsMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? SportsDesktop : SportsMobile))
</script>
