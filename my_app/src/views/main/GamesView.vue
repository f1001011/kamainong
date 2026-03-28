<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import GamesDesktop from '@/views/main/games/GamesDesktop.vue'
import GamesMobile from '@/views/main/games/GamesMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? GamesDesktop : GamesMobile))
</script>
