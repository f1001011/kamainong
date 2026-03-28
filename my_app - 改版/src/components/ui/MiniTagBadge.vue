<template>
  <span class="mini-tag-badge" :class="toneClass" :title="label">
    <component :is="icon" :size="12" :stroke-width="2.2" />
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Flame, Radio, Shield, Sparkles, Star, Swords, Trophy, Zap } from 'lucide-vue-next'

const props = defineProps<{
  label?: string
}>()

const icon = computed(() => {
  const label = props.label ?? ''
  if (/(live|直播)/i.test(label)) return Radio
  if (/(hot|热门|热议)/i.test(label)) return Flame
  if (/(top|精选|焦点)/i.test(label)) return Sparkles
  if (/(new|最新)/i.test(label)) return Star
  if (/(防守|硬仗|后防)/i.test(label)) return Shield
  if (/(冠军|王牌|奖杯)/i.test(label)) return Trophy
  if (/(对决|强强)/i.test(label)) return Swords
  return Zap
})

const toneClass = computed(() => {
  const label = props.label ?? ''
  if (/(live|直播)/i.test(label)) return 'tone-live'
  if (/(hot|热门|热议)/i.test(label)) return 'tone-hot'
  if (/(top|精选|焦点|冠军)/i.test(label)) return 'tone-gold'
  return 'tone-soft'
})
</script>

<style scoped>
.mini-tag-badge {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}

.tone-hot {
  background: rgba(255, 120, 74, 0.18);
  color: #ff8b5c;
}

.tone-live {
  background: rgba(255, 255, 255, 0.18);
  color: #f5fbff;
}

.tone-gold {
  background: rgba(231, 203, 148, 0.18);
  color: #f2d18a;
}

.tone-soft {
  background: rgba(255, 255, 255, 0.14);
  color: #f8f2e4;
}
</style>
