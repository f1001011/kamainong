<template>
  <Teleport to="body">
    <div v-if="show" class="notice-overlay" @click.self="close">
      <div class="notice-modal">
        <button class="close-btn" @click="close">
          <X :size="20" />
        </button>
        <div class="notice-content" v-html="content"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  show: boolean
  content: string
}>()

const emit = defineEmits<{ close: [] }>()
const close = () => emit('close')
</script>

<style scoped>
.notice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.notice-modal {
  background: rgba(14, 14, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  padding: 20px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.notice-content {
  color: #fff;
  line-height: 1.6;
  overflow-y: auto;
  max-height: 60vh;
}
</style>
