<template>
  <div class="page-container">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="router.back()">
      <ArrowLeft :size="24" />
    </button>

    <!-- 余额展示条 -->
    <div class="balance-card">
      <div class="balance-label">
        <Wallet :size="20" />
        <span>可用余额</span>
      </div>
      <div class="balance-amount">${{ formatNumber(currentBalance) }}</div>
    </div>

    <!-- 页面标题 -->
    <h1 class="page-title">充值</h1>

    <!-- 金额选择卡片 -->
    <div class="amount-card">
      <div class="amount-display" :class="{ valid: finalAmount > 0 }">
        ${{ formatNumber(finalAmount || 0) }}
      </div>
      
      <!-- 预设金额 -->
      <div class="preset-amounts">
        <button
          v-for="amount in presets"
          :key="amount"
          :class="['preset-btn', { active: selectedAmount === amount }]"
          @click="handlePresetSelect(amount)"
        >
          ${{ amount }}
        </button>
      </div>

      <!-- 自定义金额 -->
      <div class="custom-amount">
        <input
          v-model="customAmount"
          type="number"
          placeholder="输入金额"
          @input="handleCustomInput"
        />
      </div>

      <!-- 金额错误提示 -->
      <div v-if="amountError" class="amount-error">{{ amountError }}</div>
    </div>

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      {{ isSubmitting ? '处理中...' : `充值 $${formatNumber(finalAmount || 0)}` }}
    </button>

    <!-- 信任标识 -->
    <div class="trust-info">
      <ShieldCheck :size="16" />
      <span>安全支付 · 处理时间约5分钟</span>
    </div>

    <!-- 充值记录入口 -->
    <button class="record-btn" @click="router.push('/recharge/records')">
      <span>查看充值记录</span>
      <ArrowRight :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Wallet, ShieldCheck } from 'lucide-vue-next'
import request from '@/api/request'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { showPopup } = usePopup()

// 状态
const isLoading = ref(true)
const isSubmitting = ref(false)
const currentBalance = ref(0)
const presets = ref<number[]>([50, 100, 200, 500, 1000, 2000])
const minAmount = ref(10)
const maxAmount = ref(50000)
const selectedAmount = ref<number | null>(null)
const customAmount = ref('')

// 计算最终金额
const finalAmount = computed(() => {
  if (selectedAmount.value !== null) return selectedAmount.value
  if (customAmount.value) {
    const amount = parseFloat(customAmount.value)
    return isNaN(amount) ? 0 : amount
  }
  return 0
})

// 金额是否有效
const isAmountValid = computed(() => {
  if (finalAmount.value <= 0) return false
  return finalAmount.value >= minAmount.value && finalAmount.value <= maxAmount.value
})

// 金额错误
const amountError = computed(() => {
  if (finalAmount.value <= 0) return undefined
  if (selectedAmount.value !== null) return undefined
  if (finalAmount.value < minAmount.value || finalAmount.value > maxAmount.value) {
    return `金额范围: $${minAmount.value} - $${maxAmount.value}`
  }
  return undefined
})

// 是否可提交
const canSubmit = computed(() => {
  return isAmountValid.value
})

// 格式化数字
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 加载数据
async function loadData() {
  try {
    isLoading.value = true
    // 获取用户余额
    const profileRes = await request.get('/user/profile')
    currentBalance.value = parseFloat(profileRes.availableBalance) || 0

    // 获取充值配置
    const configRes = await request.get('/recharge/channels')
    presets.value = configRes.presets || [50, 100, 200, 500, 1000, 2000]
    minAmount.value = parseFloat(configRes.minAmount) || 10
    maxAmount.value = parseFloat(configRes.maxAmount) || 50000
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    isLoading.value = false
  }
}

// 选择预设金额
function handlePresetSelect(amount: number) {
  selectedAmount.value = amount
  customAmount.value = ''
}

// 自定义金额输入
function handleCustomInput() {
  selectedAmount.value = null
}

// 提交充值
async function handleSubmit() {
  if (!canSubmit.value) return

  try {
    isSubmitting.value = true
    const res = await request.post('/recharge/create', {
      amount: finalAmount.value.toFixed(2)
    })

    if (res.payUrl) {
      window.location.href = res.payUrl
    }
  } catch (e: any) {
    console.error('充值失败', e)
    showPopup(e.message || '充值失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
}

.back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 40;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.balance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  padding: 16px;
  margin-top: 60px;
  color: white;
}

.balance-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.8;
}

.balance-amount {
  font-size: 20px;
  font-weight: 700;
  font-family: monospace;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 20px 0;
}

.amount-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.amount-display {
  text-align: center;
  font-size: 40px;
  font-weight: 700;
  color: #ddd;
  margin-bottom: 20px;
  transition: color 0.2s;
}

.amount-display.valid {
  color: #333;
}

.preset-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 16px;
}

.preset-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: #f9f9f9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.custom-amount input {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #eee;
  font-size: 16px;
  text-align: center;
  outline: none;
}

.custom-amount input:focus {
  border-color: #667eea;
}

.amount-error {
  color: #ff4d4d;
  font-size: 12px;
  text-align: center;
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trust-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}

.record-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-top: 16px;
  background: white;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}
</style>
