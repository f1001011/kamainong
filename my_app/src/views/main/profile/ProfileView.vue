<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import ProfileDesktop from '@/views/main/profile/ProfileDesktop.vue'
import ProfileMobile from '@/views/main/profile/ProfileMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? ProfileDesktop : ProfileMobile))
</script>
