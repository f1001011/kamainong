<template>
  <div class="page-container">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">提现</h1>
      <button class="nav-btn" @click="router.push('/withdraw/records')">
        <FileText :size="20" />
      </button>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-header">
        <span>可用余额</span>
        <button class="toggle-btn" @click="isBalanceHidden = !isBalanceHidden">
          {{ isBalanceHidden ? '显示' : '隐藏' }}
        </button>
      </div>
      <div class="balance-amount">
        {{ isBalanceHidden ? '****' : `$${formatNumber(availableBalance)}` }}
      </div>
      <div class="frozen-balance">
        冻结余额: {{ isBalanceHidden ? '****' : `$${formatNumber(frozenBalance)}` }}
      </div>
    </div>

    <!-- 限制提示 -->
    <div class="limits-card">
      <div class="limit-item">
        <span class="limit-label">提现时间</span>
        <span class="limit-value">{{ timeRange }}</span>
      </div>
      <div class="limit-item">
        <span class="limit-label">今日次数</span>
        <span class="limit-value">{{ todayCount }} / {{ dailyLimit }}</span>
      </div>
      <div class="limit-item">
        <span class="limit-label">提现金额</span>
        <span class="limit-value">${{ minAmount }} - ${{ formatNumber(maxAmount) }}</span>
      </div>
      <div v-if="!inTimeRange" class="limit-error">
        当前不在提现时间范围内
      </div>
    </div>

    <!-- 金额输入卡片 -->
    <div class="input-card">
      <div class="input-label">提现金额</div>
      
      <!-- 预设金额 -->
      <div class="preset-amounts">
        <button
          v-for="amount in quickAmounts"
          :key="amount"
          :class="['preset-btn', { active: selectedAmount === amount }]"
          @click="handlePresetSelect(amount)"
        >
          ${{ amount }}
        </button>
      </div>

      <!-- 自定义金额 -->
      <div class="custom-amount">
        <span class="currency">$</span>
        <input
          v-model="customAmount"
          type="number"
          placeholder="请输入金额"
          @input="handleCustomInput"
        />
      </div>

      <!-- 金额错误 -->
      <div v-if="amountError" class="amount-error">{{ amountError }}</div>

      <!-- 费用计算 -->
      <div v-if="finalAmount > 0" class="fee-info">
        <div class="fee-row">
          <span>手续费 ({{ feePercent }}%)</span>
          <span>-${{ formatNumber(calculateFee()) }}</span>
        </div>
        <div class="fee-row total">
          <span>实际到账</span>
          <span>${{ formatNumber(calculateActual()) }}</span>
        </div>
      </div>

      <!-- 提现全部按钮 -->
      <button class="all-in-btn" @click="handleWithdrawAll">
        提现全部
      </button>
    </div>

    <!-- 银行卡选择 -->
    <div class="bank-card">
      <div class="bank-header">
        <span>选择银行卡</span>
        <button class="add-btn" @click="router.push('/bank-cards/add')">
          添加
        </button>
      </div>
      <div v-if="bankCards.length === 0" class="no-bank">
        暂无银行卡，请添加
      </div>
      <div v-else class="bank-list">
        <div
          v-for="card in bankCards"
          :key="card.id"
          :class="['bank-item', { selected: selectedCardId === card.id }]"
          @click="selectedCardId = card.id"
        >
          <div class="bank-name">{{ card.bankName }}</div>
          <div class="bank-number">{{ card.cardNumber }}</div>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      <ShieldCheck :size="20" />
      {{ isSubmitting ? '处理中...' : '提现' }}
    </button>

    <!-- 不可提现提示 -->
    <div v-if="!canWithdraw" class="block-tip">
      {{ blockReasonText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-vue-next'
import request from '@/api/request'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { showPopup } = usePopup()

// 状态
const isLoading = ref(true)
const isSubmitting = ref(false)
const isBalanceHidden = ref(false)

// 余额
const availableBalance = ref(0)
const frozenBalance = ref(0)

// 限制
const canWithdraw = ref(true)
const blockReason = ref<string | null>(null)
const feePercent = ref(10)
const minAmount = ref(12000)
const maxAmount = ref(0)
const timeRange = ref('10:00-17:00')
const inTimeRange = ref(true)
const todayCount = ref(0)
const dailyLimit = ref(1)
const quickAmounts = ref<number[]>([])

// 银行卡
const bankCards = ref<any[]>([])

// 表单
const selectedAmount = ref<number | null>(null)
const customAmount = ref('')
const selectedCardId = ref<number | null>(null)

// 计算最终金额
const finalAmount = computed(() => {
  if (selectedAmount.value !== null) return selectedAmount.value
  if (customAmount.value) {
    const amount = parseFloat(customAmount.value)
    return isNaN(amount) ? 0 : amount
  }
  return 0
})

// 金额校验
function validateAmount(amount: number): string | null {
  if (amount < minAmount.value) return `最低提现金额 $${minAmount.value}`
  if (amount > maxAmount.value) return `最高提现金额 $${formatNumber(maxAmount.value)}`
  if (amount > availableBalance.value) return '余额不足'
  return null
}

// 金额错误
const amountError = computed(() => {
  if (finalAmount.value <= 0) return undefined
  if (selectedAmount.value !== null) return undefined
  return validateAmount(finalAmount.value)
})

// 是否可提交
const canSubmit = computed(() => {
  if (!canWithdraw.value) return false
  if (!inTimeRange.value) return false
  if (todayCount.value >= dailyLimit.value) return false
  if (!validateAmount(finalAmount.value)) return false
  if (selectedCardId.value === null) return false
  return true
})

// 阻止原因文本
const blockReasonText = computed(() => {
  switch (blockReason.value) {
    case 'THRESHOLD_NOT_MET': return '满足提现门槛后即可提现'
    case 'NOT_RECHARGED': return '充值后方可提现'
    case 'NO_BANK_CARD': return '请先绑定银行卡'
    default: return '暂无法提现'
  }
})

// 格式化数字
function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN')
}

// 计算手续费
function calculateFee(): number {
  return finalAmount.value * (feePercent.value / 100)
}

// 计算实际到账
function calculateActual(): number {
  return finalAmount.value - calculateFee()
}

// 加载数据
async function loadData() {
  try {
    isLoading.value = true
    
    // 并行请求
    const [checkRes, cardsRes] = await Promise.all([
      request.get('/withdraw/check'),
      request.get('/bank-cards')
    ])

    // 提现条件
    canWithdraw.value = checkRes.canWithdraw
    blockReason.value = checkRes.reason
    availableBalance.value = parseFloat(checkRes.availableBalance) || 0
    feePercent.value = checkRes.feePercent || 10
    minAmount.value = parseFloat(checkRes.minAmount) || 12000
    maxAmount.value = parseFloat(checkRes.maxAmount) || 0
    timeRange.value = checkRes.timeRange || '10:00-17:00'
    inTimeRange.value = checkRes.inTimeRange
    todayCount.value = checkRes.todayCount || 0
    dailyLimit.value = checkRes.dailyLimit || 1
    quickAmounts.value = checkRes.quickAmounts || []

    // 银行卡
    bankCards.value = cardsRes.list || []
    if (bankCards.value.length > 0) {
      selectedCardId.value = bankCards.value[0].id
    }

    // 获取冻结余额
    const profileRes = await request.get('/user/profile')
    frozenBalance.value = parseFloat(profileRes.frozenBalance) || 0
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

// 提现全部
function handleWithdrawAll() {
  const max = Math.min(maxAmount.value, availableBalance.value)
  customAmount.value = max.toString()
  selectedAmount.value = null
}

// 提交提现
async function handleSubmit() {
  if (!canSubmit.value || selectedCardId.value === null) return

  try {
    isSubmitting.value = true
    await request.post('/withdraw/create', {
      amount: finalAmount.value.toFixed(2),
      bankCardId: selectedCardId.value
    })

    showPopup('提现申请已提交', 'success')
    
    // 重置表单并刷新数据
    selectedAmount.value = null
    customAmount.value = ''
    await loadData()
  } catch (e: any) {
    console.error('提现失败', e)
    showPopup(e.message || '提现失败', 'error')
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
  background: #f8f8f8;
  padding: 16px;
  padding-bottom: 100px;
}

.top-nav {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  background: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(20px);
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

.balance-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-header span {
  font-size: 14px;
  color: #999;
}

.toggle-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  font-family: monospace;
}

.frozen-balance {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.limits-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.limit-label {
  color: #999;
  font-size: 14px;
}

.limit-value {
  color: #333;
  font-size: 14px;
}

.limit-error {
  color: #ff4d4d;
  font-size: 12px;
  text-align: center;
  margin-top: 12px;
}

.input-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.input-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.preset-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.preset-btn {
  flex: 1;
  min-width: 70px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #eee;
  background: #f9f9f9;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.custom-amount {
  display: flex;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 0 16px;
}

.custom-amount .currency {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.custom-amount input {
  flex: 1;
  padding: 14px 12px;
  border: none;
  font-size: 20px;
  font-weight: 700;
  outline: none;
}

.amount-error {
  color: #ff4d4d;
  font-size: 12px;
  margin-top: 8px;
}

.fee-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  padding: 4px 0;
}

.fee-row.total {
  font-weight: 700;
  color: #333;
  font-size: 16px;
}

.all-in-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f5f5;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
}

.bank-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.bank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bank-header span {
  font-size: 14px;
  color: #333;
}

.add-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
}

.no-bank {
  text-align: center;
  color: #999;
  padding: 20px;
}

.bank-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}

.bank-item.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.bank-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.bank-number {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.block-tip {
  text-align: center;
  color: #ff4d4d;
  font-size: 14px;
  margin-top: 16px;
}
</style>
