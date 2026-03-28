<template>
  <component :is="currentView" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useViewportMode } from '@/composables/useViewportMode'
import RecordHistoryDesktop from '@/views/main/profile/RecordHistoryDesktop.vue'
import RecordHistoryMobile from '@/views/main/profile/RecordHistoryMobile.vue'

const { isDesktop } = useViewportMode()

const currentView = computed(() => (isDesktop.value ? RecordHistoryDesktop : RecordHistoryMobile))
</script>
