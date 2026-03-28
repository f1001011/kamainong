<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import HomeDesktop from '@/views/main/home/HomeDesktop.vue'
import HomeMobile from '@/views/main/home/HomeMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? HomeDesktop : HomeMobile))
</script>
