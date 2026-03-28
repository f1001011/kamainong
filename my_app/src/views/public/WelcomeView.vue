<template>
  <WelcomeDesktop v-if="isDesktop" />
  <WelcomeMobile v-else />
</template>

<script lang="ts" setup>
import { useViewportMode } from '@/composables/useViewportMode'
import WelcomeDesktop from './WelcomeDesktop.vue'
import WelcomeMobile from './WelcomeMobile.vue'

const { isDesktop } = useViewportMode()
</script>
