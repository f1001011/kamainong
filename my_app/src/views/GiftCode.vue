<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">礼包码</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="gift-content">
      <div class="input-area">
        <input
          v-model="giftCode"
          type="text"
          placeholder="请输入礼包码"
          class="code-input"
        />
      </div>
      <button class="submit-btn" @click="handleRedeem" :disabled="!giftCode || isSubmitting">
        {{ isSubmitting ? '兑换中...' : '立即兑换' }}
      </button>
      <div class="gift-tips">
        <Gift :size="16" />
        <span>输入礼包码，领取专属奖励</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Gift } from 'lucide-vue-next'
import request from '@/api/request'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { showPopup } = usePopup()

const giftCode = ref('')
const isSubmitting = ref(false)

async function handleRedeem() {
  if (!giftCode.value) return

  try {
    isSubmitting.value = true
    await request.post('/gift-code/redeem', { code: giftCode.value })
    showPopup('兑换成功', 'success')
    giftCode.value = ''
  } catch (e: any) {
    showPopup(e.message || '兑换失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.top-nav {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  z-index: 10;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.gift-content {
  padding: 24px 16px;
}

.input-area {
  background: white;
  border-radius: 16px;
  padding: 16px;
}

.code-input {
  width: 100%;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 16px;
  text-align: center;
  outline: none;
}

.code-input:focus {
  border-color: #667eea;
}

.submit-btn {
  width: 100%;
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
}

.gift-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}
</style>
