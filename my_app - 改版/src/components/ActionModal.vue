<template>
  <Teleport to="body">
    <div class="action-overlay" @click.self="$emit('close')">
      <div class="action-modal"
        v-motion
        :initial="{ opacity:0, scale:0.78, y:36 }"
        :enter="{ opacity:1, scale:1, y:0, transition:{ type:'spring', stiffness:320, damping:22 } }">

        <div class="modal-glow" :style="{ background: action.glowColor }"></div>

        <!-- Top bar -->
        <div class="modal-top-bar" :style="{ background: action.gradient }"></div>

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-icon-3d" :style="{ background: action.gradient }">
            <div class="modal-icon-face">
              <component :is="action.icon" :size="24" />
            </div>
            <div class="modal-icon-hl"></div>
          </div>
          <div class="modal-titles">
            <div class="modal-title">{{ action.label }}</div>
            <div class="modal-subtitle">{{ action.subtitle }}</div>
          </div>
          <button class="modal-close" @click="$emit('close')">
            <X :size="16" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="amount-wrap" :class="{ focused: isFocused }">
            <span class="amount-prefix">{{ CURRENCY }}</span>
            <input
              ref="inputRef"
              v-model="inputAmount"
              type="number"
              class="amount-input"
              :placeholder="action.placeholder"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @input="onInput"
            />
          </div>

          <div class="quick-row">
            <button
              v-for="amt in [100, 500, 1000, 5000]" :key="amt"
              class="quick-btn"
              :class="{ active: inputAmount === String(amt) }"
              @click="inputAmount = String(amt)">
              {{ CURRENCY }}{{ amt.toLocaleString() }}
            </button>
          </div>

          <div class="modal-note">
            <Info :size="12" />
            <span>{{ action.note }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button
            class="btn-confirm"
            :style="{ background: action.gradient }"
            :class="{ bursting, confirmed }"
            :disabled="!inputAmount || Number(inputAmount) <= 0"
            @click="handleConfirm">
            <span v-if="!confirmed">{{ t('modal.confirmAction', { action: action.label }) }}</span>
            <span v-else class="confirm-ok">
              <CheckCircle :size="15" /> {{ t('modal.operationSuccess') }}
            </span>
            <div v-if="bursting" class="burst-ring"></div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue'
import { CURRENCY } from '@/config'
import { useI18n } from 'vue-i18n'
import { X, Info, CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  action: {
    key: string; label: string; subtitle: string
    placeholder: string; note: string; icon: any
    gradient: string; glowColor: string
  }
}>()

const emit = defineEmits<{
  close: []
  confirm: [amount: number, actionKey: string]
}>()

const inputRef    = ref<HTMLInputElement>()
const inputAmount = ref('')
const isFocused   = ref(false)
const bursting    = ref(false)
const confirmed   = ref(false)
const { t } = useI18n()

onMounted(() => nextTick(() => inputRef.value?.focus()))

const onInput = () => {
  if (Number(inputAmount.value) < 0) inputAmount.value = ''
}

const handleConfirm = async () => {
  if (!inputAmount.value || Number(inputAmount.value) <= 0) return
  bursting.value = true
  await new Promise(r => setTimeout(r, 280))
  confirmed.value = true
  await new Promise(r => setTimeout(r, 900))
  emit('confirm', Number(inputAmount.value), props.action.key)
  bursting.value = false
  confirmed.value = false
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.action-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 20px;
}

.action-modal {
  position: relative;
  width: 100%; max-width: 390px;
  background: rgba(14,14,18,0.92);
  backdrop-filter: blur(36px) saturate(160%);
  -webkit-backdrop-filter: blur(36px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 28px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
  font-family: 'Inter','SF Pro Text',-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}

.modal-glow {
  position: absolute; top: -70px; left: 50%;
  transform: translateX(-50%);
  width: 220px; height: 220px; border-radius: 50%;
  opacity: 0.18; filter: blur(40px); pointer-events: none;
}

.modal-top-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}

/* ── Header ── */
.modal-header {
  display: flex; align-items: center; gap: 13px;
  padding: 22px 20px 18px;
}

.modal-icon-3d {
  position: relative;
  width: 46px; height: 46px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
  transform: perspective(100px) rotateX(10deg) rotateY(-7deg);
  box-shadow: 3px 4px 0 rgba(0,0,0,0.35), 6px 8px 0 rgba(0,0,0,0.18);
}
.modal-icon-face { position: relative; z-index: 1; }
.modal-icon-hl {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%);
  pointer-events: none;
}

.modal-titles { flex: 1; }
.modal-title {
  font-size: 16px; font-weight: 600; color: #fff; letter-spacing: 0.2px;
}
.modal-subtitle {
  font-size: 11px; font-weight: 400; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.4); margin-top: 3px;
}

.modal-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.13); }

/* ── Body ── */
.modal-body { padding: 0 20px 16px; }

.amount-wrap {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px; padding: 13px 16px; gap: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.amount-wrap.focused {
  border-color: rgba(255,77,77,0.45);
  box-shadow: 0 0 0 3px rgba(255,77,77,0.1);
}
.amount-prefix {
  font-size: 20px; font-weight: 300; color: rgba(255,255,255,0.35);
}
.amount-input {
  flex: 1; background: none; border: none; outline: none;
  font-size: 26px; font-weight: 600; color: #fff;
  font-family: inherit;
}
.amount-input::placeholder { color: rgba(255,255,255,0.18); font-weight: 300; font-size: 20px; }
.amount-input::-webkit-inner-spin-button,
.amount-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.quick-row {
  display: flex; gap: 7px; margin-top: 12px;
}
.quick-btn {
  flex: 1; padding: 7px 4px; border-radius: 9px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
}
.quick-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }
.quick-btn.active {
  background: rgba(255,77,77,0.15);
  border-color: rgba(255,77,77,0.4);
  color: #ff8080;
}

.modal-note {
  display: flex; align-items: center; gap: 5px;
  margin-top: 12px; font-size: 11px; font-weight: 400;
  color: rgba(255,255,255,0.28); letter-spacing: 0.2px;
}

/* ── Footer ── */
.modal-footer {
  display: flex; gap: 9px; padding: 0 20px 20px;
}
.btn-cancel {
  flex: 1; padding: 13px; border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background 0.2s; font-family: inherit;
}
.btn-cancel:hover { background: rgba(255,255,255,0.1); }

.btn-confirm {
  flex: 2; padding: 13px; border-radius: 12px;
  border: none; color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 0.2s, transform 0.15s; font-family: inherit;
}
.btn-confirm:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-confirm:active:not(:disabled) { transform: scale(0.97); }
.btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }

.confirm-ok {
  display: flex; align-items: center; gap: 6px;
  animation: pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1);
}

.burst-ring {
  position: absolute; inset: 0; border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.55);
  animation: burst 0.45s ease-out forwards;
  pointer-events: none;
}

@keyframes burst {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.14); opacity: 0; }
}
@keyframes pop-in {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.action-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.62);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 20px;
}

.action-modal {
  position: relative;
  width: 100%; max-width: 380px;
  background: rgba(14,14,18,0.94);
  backdrop-filter: blur(36px) saturate(160%);
  -webkit-backdrop-filter: blur(36px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.55);
  font-family: 'Inter','SF Pro Text',-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}

.modal-glow {
  position: absolute; top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 200px; border-radius: 50%;
  opacity: 0.15; filter: blur(36px); pointer-events: none;
}
.modal-top-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}

/* Header */
.modal-header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 18px 16px;
}
.modal-icon-3d {
  position: relative;
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
  transform: perspective(100px) rotateX(10deg) rotateY(-7deg);
  box-shadow: 3px 4px 0 rgba(0,0,0,0.35), 6px 8px 0 rgba(0,0,0,0.18);
}
.modal-icon-face { position: relative; z-index: 1; }
.modal-icon-hl {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%);
  pointer-events: none;
}
.modal-titles { flex: 1; }
.modal-title {
  font-size: 15px; font-weight: 600; color: #fff; letter-spacing: 0.2px;
}
.modal-subtitle {
  font-size: 11px; font-weight: 400; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.38); margin-top: 3px;
}
.modal-close {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.45);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.12); }

/* Body */
.modal-body { padding: 0 18px 14px; }
.amount-wrap {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px; padding: 12px 15px; gap: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.amount-wrap.focused {
  border-color: rgba(255,77,77,0.4);
  box-shadow: 0 0 0 3px rgba(255,77,77,0.08);
}
.amount-prefix {
  font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.3);
}
.amount-input {
  flex: 1; background: none; border: none; outline: none;
  font-size: 24px; font-weight: 600; color: #fff; font-family: inherit;
}
.amount-input::placeholder { color: rgba(255,255,255,0.16); font-weight: 300; font-size: 18px; }
.amount-input::-webkit-inner-spin-button,
.amount-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.quick-row { display: flex; gap: 7px; margin-top: 11px; }
.quick-btn {
  flex: 1; padding: 7px 4px; border-radius: 9px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all 0.18s; font-family: inherit;
}
.quick-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); }
.quick-btn.active {
  background: rgba(255,77,77,0.12);
  border-color: rgba(255,77,77,0.35);
  color: #ff8080;
}

.modal-note {
  display: flex; align-items: center; gap: 5px;
  margin-top: 11px; font-size: 11px; font-weight: 400;
  color: rgba(255,255,255,0.25); letter-spacing: 0.2px;
}

/* Footer */
.modal-footer { display: flex; gap: 8px; padding: 0 18px 18px; }
.btn-cancel {
  flex: 1; padding: 12px; border-radius: 11px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: background 0.2s; font-family: inherit;
}
.btn-cancel:hover { background: rgba(255,255,255,0.09); }

.btn-confirm {
  flex: 2; padding: 12px; border-radius: 11px;
  border: none; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity 0.2s, transform 0.15s; font-family: inherit;
}
.btn-confirm:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-confirm:active:not(:disabled) { transform: scale(0.97); }
.btn-confirm:disabled { opacity: 0.3; cursor: not-allowed; }

.confirm-ok {
  display: flex; align-items: center; gap: 6px;
  animation: pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1);
}
.burst-ring {
  position: absolute; inset: 0; border-radius: 11px;
  border: 2px solid rgba(255,255,255,0.5);
  animation: burst 0.45s ease-out forwards;
  pointer-events: none;
}
@keyframes burst {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.14); opacity: 0; }
}
@keyframes pop-in {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
