<template>
  <div class="bc-root">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="page-scroll">
      <header class="page-header glass-card">
        <h1 class="page-title">我的</h1>
        <button class="glass-icon-btn" @click="router.push('/settings')">
          <Settings :size="18" />
        </button>
      </header>

      <section class="hero-card glass-card">
        <div class="hero-label">总资产 ({{ CURRENCY }})</div>
        <div class="hero-amount">{{ CURRENCY }} {{ formatAmount(balanceData?.totalAssets) }}</div>
        <div class="hero-earn">今日收益 +{{ CURRENCY }} {{ formatAmount(balanceData?.todayEarnings) }}</div>

        <div class="hero-row">
          <div class="hero-stat">
            <span class="label">可用余额</span>
            <span class="value">{{ CURRENCY }} {{ formatAmount(balanceData?.availableBalance) }}</span>
          </div>
          <div class="hero-stat">
            <span class="label">冻结金额</span>
            <span class="value">{{ CURRENCY }} {{ formatAmount(balanceData?.frozenAmount) }}</span>
          </div>
          <button class="hero-stat integral-btn" @click="router.push('/points-records')">
            <span class="label">积分</span>
            <span class="value">{{ formatAmount(balanceData?.integral, 0) }}</span>
          </button>
        </div>
      </section>

      <section class="actions-grid">
        <button v-for="item in actions" :key="item.key" class="action-item glass-card" @click="handleAction(item.key)">
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </section>

      <section class="quick-links glass-card">
        <button @click="router.push('/investments')">
          <span>我的投资</span>
          <ChevronRight :size="14" />
        </button>
        <button @click="router.push('/team')">
          <span>我的团队</span>
          <ChevronRight :size="14" />
        </button>
      </section>

      <section class="stats-row">
        <div class="stat-card glass-card">
          <span class="stat-label">本月收入</span>
          <span class="stat-value income">{{ CURRENCY }} {{ formatAmount(balanceData?.monthlyIncome) }}</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-label">本月支出</span>
          <span class="stat-value expense">{{ CURRENCY }} {{ formatAmount(balanceData?.monthlyExpense) }}</span>
        </div>
      </section>

      <section class="tx-section">
        <div class="section-header">
          <span class="section-title">近期交易</span>
          <button class="more-btn" @click="router.push('/records')">查看全部</button>
        </div>

        <div v-if="transactions.length" class="tx-list">
          <div v-for="tx in transactions" :key="tx.id" class="tx-item glass-card">
            <div class="tx-main">
              <div class="tx-title">{{ tx.title }}</div>
              <div class="tx-time">{{ tx.createdAt }}</div>
            </div>
            <div class="tx-amount" :class="tx.type">
              {{ tx.type === 'income' ? '+' : '-' }}{{ CURRENCY }}{{ formatAmount(tx.amount) }}
            </div>
          </div>
        </div>

        <div v-else class="tx-empty glass-card">暂无记录</div>
      </section>
    </div>

    <RechargeWithdrawModal
      :show="showModal"
      :type="modalType"
      @close="showModal = false"
      @success="loadBalance"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Settings,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarCheck,
  ClipboardList,
  FerrisWheel,
  BriefcaseBusiness,
  ShoppingBag,
  PartyPopper,
} from 'lucide-vue-next'
import { CURRENCY } from '@/config'
import RechargeWithdrawModal from '@/components/RechargeWithdrawModal.vue'
import { fetchBalanceData, signIn } from '@/api/balance'
import type { BalanceData } from '@/types/balance'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { showPopup } = usePopup()

const balanceData = ref<BalanceData | null>(null)
const showModal = ref(false)
const modalType = ref<'recharge' | 'withdraw'>('recharge')

const actions = [
  { key: 'deposit', label: '充值', icon: ArrowDownCircle },
  { key: 'withdraw', label: '提现', icon: ArrowUpCircle },
  { key: 'signin', label: '签到', icon: CalendarCheck },
  { key: 'records', label: '记录', icon: ClipboardList },
  { key: 'lottery', label: '转盘', icon: FerrisWheel },
  { key: 'products', label: '理财产品', icon: BriefcaseBusiness },
  { key: 'purchased', label: '已购产品', icon: ShoppingBag },
  { key: 'activities', label: '活动', icon: PartyPopper },
]

const transactions = computed(() => (balanceData.value?.transactions || []).slice(0, 6))

const formatAmount = (value: unknown, digits = 2) => {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const loadBalance = async () => {
  balanceData.value = await fetchBalanceData()
}

const handleSignIn = async () => {
  const result = await signIn()
  showPopup(`签到成功，获得 ${CURRENCY} ${formatAmount(result.amount)}`, 'success')
  await loadBalance()
}

const handleAction = async (key: string) => {
  if (key === 'deposit') {
    modalType.value = 'recharge'
    showModal.value = true
    return
  }

  if (key === 'withdraw') {
    modalType.value = 'withdraw'
    showModal.value = true
    return
  }

  if (key === 'signin') {
    await handleSignIn()
    return
  }

  if (key === 'records') {
    router.push('/records')
    return
  }

  if (key === 'lottery') {
    router.push('/lottery')
    return
  }

  if (key === 'products') {
    router.push('/products')
    return
  }

  if (key === 'purchased') {
    router.push('/investments')
    return
  }

  if (key === 'activities') {
    router.push('/activities')
  }
}

onMounted(loadBalance)
</script>

<style scoped>
.bc-root {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red { width: 440px; height: 440px; top: -120px; left: -70px; background: var(--orb-red); }
.orb-cyan { width: 400px; height: 400px; top: 30%; right: -70px; background: var(--orb-cyan); }
.orb-amber { width: 320px; height: 320px; bottom: 6%; left: 15%; background: var(--orb-amber); }

.page-scroll {
  position: relative;
  z-index: 1;
  max-width: 460px;
  margin: 0 auto;
  padding: 14px 20px 86px;
}

.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  margin-bottom: 14px;
}

.page-title {
  font-size: 18px;
  color: var(--text-primary);
}

.glass-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
}

.hero-card {
  padding: 16px;
  margin-bottom: 14px;
}

.hero-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
}

.hero-amount {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-earn {
  margin-top: 8px;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--color-cyan);
  background: rgba(0, 229, 255, 0.12);
  font-size: 12px;
}

.hero-row {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.hero-stat {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-stat .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.hero-stat .value {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

.integral-btn {
  border: 1px solid color-mix(in srgb, var(--color-amber) 38%, transparent);
  background: color-mix(in srgb, var(--color-amber) 9%, transparent);
  text-align: left;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.action-item {
  border: none;
  padding: 12px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
}

.quick-links {
  padding: 4px 10px;
  margin-bottom: 12px;
}

.quick-links button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 2px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.quick-links button:last-child {
  border-bottom: none;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.stat-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.52);
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
}

.stat-value.income { color: var(--color-cyan); }
.stat-value.expense { color: var(--color-red); }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  color: var(--text-primary);
  font-size: 14px;
}

.more-btn {
  border: none;
  background: none;
  color: var(--color-red);
  font-size: 12px;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-item {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.tx-main {
  min-width: 0;
}

.tx-title {
  color: var(--text-primary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-time {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
}

.tx-amount {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.tx-amount.income { color: var(--color-cyan); }
.tx-amount.expense { color: var(--color-red); }

.tx-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.48);
  padding: 20px 12px;
}
</style>
