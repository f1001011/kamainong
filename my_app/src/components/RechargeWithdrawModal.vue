<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ type === 'recharge' ? t('balance.recharge') : t('balance.withdraw') }}</h3>
          <button class="close-btn" @click="close">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <div class="amount-input">
            <span class="currency">XAF</span>
            <input v-model="amount" type="number" :placeholder="t('common.enterAmount')" />
          </div>

          <div v-if="type === 'recharge'" class="quick-amounts">
            <button v-for="amt in [10000, 50000, 100000, 500000]" :key="amt" @click="amount = String(amt)">
              {{ amt.toLocaleString() }}
            </button>
          </div>

          <div v-if="type === 'withdraw'" class="bank-select">
            <select v-model="bankCard">
              <option value="">{{ t('withdraw.selectCard') }}</option>
              <option v-for="card in cards" :key="card.id" :value="card.id">
                {{ card.bank }} - {{ card.number }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="submit-btn" :disabled="!canSubmit" @click="handleSubmit">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { createRecharge } from '@/api/recharge'
import { createWithdraw, getBankCards } from '@/api/withdraw'

const props = defineProps<{
  show: boolean
  type: 'recharge' | 'withdraw'
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { t } = useI18n()
const amount = ref('')
const bankCard = ref('')
const cards = ref<any[]>([])

const canSubmit = computed(() => {
  if (props.type === 'withdraw') return Number(amount.value) > 0 && bankCard.value
  return Number(amount.value) > 0
})

const close = () => emit('close')

const handleSubmit = async () => {
  try {
    if (props.type === 'recharge') {
      await createRecharge({ amount: Number(amount.value), channel: 'default' })
    } else {
      await createWithdraw({ amount: Number(amount.value), bankCard: bankCard.value })
    }
    emit('success')
    close()
  } catch (err) {
    console.error(err)
  }
}

watch(() => props.show, async (val) => {
  if (val && props.type === 'withdraw') {
    cards.value = await getBankCards()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: rgba(14, 14, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.amount-input {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  gap: 8px;
  margin-bottom: 12px;
}

.currency {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.amount-input input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 18px;
  color: #fff;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.quick-amounts button {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
}

.bank-select select {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
