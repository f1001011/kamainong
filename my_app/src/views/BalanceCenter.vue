<template>
  <div class="bc-root">
    <!-- Orbs -->
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="page-scroll">
      <!-- Header -->
      <header class="page-header"
        v-motion :initial="{ opacity:0, y:-22 }"
        :enter="{ opacity:1, y:0, transition:{ delay:60 } }">
        <button class="glass-icon-btn" @click="router.back()">
          <ChevronLeft :size="20" />
        </button>
        <h1 class="page-title">{{ t('balance.title') }}</h1>
        <button class="glass-icon-btn">
          <Settings :size="20" />
        </button>
      </header>

      <!-- Hero Card -->
      <div class="hero-card glass-card"
        v-motion :initial="{ opacity:0, y:44, scale:0.93 }"
        :enter="{ opacity:1, y:0, scale:1, transition:{ delay:130, type:'spring', stiffness:190, damping:20 } }">
        <div class="hero-top-bar"></div>
        <div class="hero-glow-red"></div>
        <div class="hero-glow-cyan"></div>

        <div class="hero-label">
          <Wallet :size="13" /><span>{{ t('balance.totalAssets') }} ({{ t('balance.currency') }})</span>
        </div>

        <div class="balance-display">
          <span class="currency-sym">{{ CURRENCY }}</span>
          <div class="digit-roller-wrap">
            <template v-for="(char, i) in integerChars" :key="i">
              <span v-if="char === ','" class="digit-sep">,</span>
              <div v-else class="digit-col">
                <div class="digit-strip"
                  :style="{ transform: `translateY(-${Number(char) * 10}%)` }">
                  <span v-for="n in 10" :key="n" class="digit-char">{{ n - 1 }}</span>
                </div>
              </div>
            </template>
          </div>
          <span class="decimal-part">.{{ decimalPart }}</span>
        </div>

        <div class="balance-badge">
          <TrendingUp :size="13" />
          <span>+{{ CURRENCY }}{{ balanceData?.todayEarnings.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) ?? '--' }} {{ t('balance.todayEarnings') }}</span>
        </div>

        <div class="hero-divider"></div>

        <div class="hero-bottom">
          <div class="hero-stat">
            <span class="hs-label">{{ t('balance.available') }}</span>
            <span class="hs-value">{{ CURRENCY }} {{ balanceData?.availableBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) ?? '--' }}</span>
          </div>
          <div class="hs-sep"></div>
          <div class="hero-stat">
            <span class="hs-label">{{ t('balance.frozen') }}</span>
            <span class="hs-value amber">{{ CURRENCY }} {{ balanceData?.frozenAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) ?? '--' }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-row">
        <button
          v-for="(action, i) in actions" :key="action.key"
          class="action-card glass-card"
          v-motion
          :initial="{ opacity:0, y:28, scale:0.82 }"
          :enter="{ opacity:1, y:0, scale:1, transition:{ delay:270+i*55, type:'spring', stiffness:290, damping:18 } }"
          @click="openAction(action)">
          <div class="action-icon-3d" :style="{ '--c1': action.c1, '--c2': action.c2, '--glow': action.glow }">
            <div class="icon-face">
              <component :is="action.icon" :size="22" />
            </div>
            <div class="icon-highlight"></div>
          </div>
          <span class="action-label">{{ action.label }}</span>
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div
          v-for="(stat, i) in stats" :key="stat.label"
          class="stat-card glass-card"
          v-motion
          :initial="{ opacity:0, x:-22 }"
          :enter="{ opacity:1, x:0, transition:{ delay:430+i*70 } }">
          <div class="stat-icon-3d" :style="{ '--sc': stat.color }">
            <component :is="stat.icon" :size="15" />
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </div>
      </div>

      <!-- Transactions -->
      <div class="tx-section"
        v-motion :initial="{ opacity:0 }"
        :enter="{ opacity:1, transition:{ delay:570 } }">
        <div class="section-header">
          <span class="section-title">{{ t('balance.recentTx') }}</span>
          <button class="text-link-btn">{{ t('common.viewAll') }} <ChevronRight :size="13" /></button>
        </div>

        <div
          v-for="(tx, i) in transactions" :key="tx.id"
          class="tx-item glass-card"
          v-motion
          :initial="{ opacity:0, x:30 }"
          :enter="{ opacity:1, x:0, transition:{ delay:610+i*65 } }">
          <div class="tx-icon-3d" :style="{ '--tc': tx.color }">
            <component :is="tx.icon" :size="17" />
          </div>
          <div class="tx-info">
            <div class="tx-name">{{ tx.name }}</div>
            <div class="tx-time">{{ tx.time }}</div>
          </div>
          <div class="tx-amount" :class="tx.type">
            {{ tx.type === 'income' ? '+' : '-' }}{{ CURRENCY }}{{ tx.amount }}
          </div>
        </div>
      </div>

      <div style="height:40px"></div>
    </div>

    <ActionModal
      v-if="activeAction"
      :action="activeAction"
      @close="activeAction = null"
      @confirm="handleConfirm" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { CURRENCY } from '@/config'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChevronLeft, ChevronRight, Settings, Wallet,
  TrendingUp, TrendingDown, Lock,
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ClipboardList,
  ShoppingCart, Car, Banknote, Coffee, PiggyBank
} from 'lucide-vue-next'
import ActionModal from '@/components/ActionModal.vue'
import { fetchBalanceData } from '@/api/balance'
import type { BalanceData } from '@/types/balance'

const router = useRouter()
const { t } = useI18n()

// ── 接口数据 ────────────────────────────────────────────────────────────────
const balanceData = ref<BalanceData | null>(null)

// ── Balance counter ────────────────────────────────────────────────────────
const animatedBalance = ref(0)

const startRoll = (target: number) => {
  const duration = 2200
  const t0 = Date.now()
  const tick = () => {
    const p = Math.min((Date.now() - t0) / duration, 1)
    animatedBalance.value = target * (1 - Math.pow(1 - p, 4))
    if (p < 1) requestAnimationFrame(tick)
    else animatedBalance.value = target
  }
  setTimeout(() => requestAnimationFrame(tick), 500)
}

onMounted(async () => {
  balanceData.value = await fetchBalanceData()
  startRoll(balanceData.value.totalAssets)
})

const integerChars = computed(() =>
  Math.floor(animatedBalance.value).toLocaleString('zh-CN').split('')
)
const decimalPart = computed(() =>
  (animatedBalance.value % 1).toFixed(2).slice(2)
)

// ── Actions — 撞色方案 ──────────────────────────────────────────────────────
const actions = computed(() => [
  {
    key: 'deposit',
    label:       t('balance.actions.deposit.label'),
    subtitle:    t('balance.actions.deposit.subtitle'),
    placeholder: t('balance.actions.deposit.placeholder'),
    note:        t('balance.actions.deposit.note'),
    icon: ArrowDownCircle,
    c1: '#ff4d4d', c2: '#ff1744',
    glow: 'rgba(255,77,77,0.55)',
    gradient: 'linear-gradient(135deg,#ff4d4d,#ff1744)',
    glowColor: 'radial-gradient(circle,rgba(255,77,77,0.8),transparent)',
  },
  {
    key: 'withdraw',
    label:       t('balance.actions.withdraw.label'),
    subtitle:    t('balance.actions.withdraw.subtitle'),
    placeholder: t('balance.actions.withdraw.placeholder'),
    note:        t('balance.actions.withdraw.note'),
    icon: ArrowUpCircle,
    c1: '#00e5ff', c2: '#00b0ff',
    glow: 'rgba(0,229,255,0.55)',
    gradient: 'linear-gradient(135deg,#00e5ff,#00b0ff)',
    glowColor: 'radial-gradient(circle,rgba(0,229,255,0.8),transparent)',
  },
  {
    key: 'transfer',
    label:       t('balance.actions.transfer.label'),
    subtitle:    t('balance.actions.transfer.subtitle'),
    placeholder: t('balance.actions.transfer.placeholder'),
    note:        t('balance.actions.transfer.note'),
    icon: ArrowLeftRight,
    c1: '#ffb800', c2: '#ff6d00',
    glow: 'rgba(255,184,0,0.55)',
    gradient: 'linear-gradient(135deg,#ffb800,#ff6d00)',
    glowColor: 'radial-gradient(circle,rgba(255,184,0,0.8),transparent)',
  },
  {
    key: 'history',
    label:       t('balance.actions.history.label'),
    subtitle:    t('balance.actions.history.subtitle'),
    placeholder: t('balance.actions.history.placeholder'),
    note:        t('balance.actions.history.note'),
    icon: ClipboardList,
    c1: '#69ff47', c2: '#00e676',
    glow: 'rgba(105,255,71,0.55)',
    gradient: 'linear-gradient(135deg,#69ff47,#00e676)',
    glowColor: 'radial-gradient(circle,rgba(105,255,71,0.8),transparent)',
  },
])

// ── 相对时间格式化 ──────────────────────────────────────────────────────────
const formatRelativeTime = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600)   return t('balance.time.minutesAgo', { n: Math.max(1, Math.floor(diff / 60)) })
  if (diff < 86400)  return t('balance.time.hourAgo',    { n: Math.floor(diff / 3600) })
  if (diff < 172800) return t('balance.time.yesterday')
  return t('balance.time.daysAgo', { n: Math.floor(diff / 86400) })
}

// ── 交易分类 → 图标/颜色映射（纯前端配置）────────────────────────────────────
const CATEGORY_MAP: Record<string, { icon: any; color: string; nameKey: string }> = {
  wechat:  { icon: Banknote,     color: '#00e5ff', nameKey: 'balance.tx.wechat'  },
  meituan: { icon: ShoppingCart, color: '#ff4d4d', nameKey: 'balance.tx.meituan' },
  salary:  { icon: PiggyBank,    color: '#69ff47', nameKey: 'balance.tx.salary'  },
  didi:    { icon: Car,          color: '#ff4d4d', nameKey: 'balance.tx.didi'    },
  coffee:  { icon: Coffee,       color: '#ffb800', nameKey: 'balance.tx.coffee'  },
}

// ── Stats（来自接口）──────────────────────────────────────────────────────────
const stats = computed(() => {
  const d = balanceData.value
  const fmt = (n: number) => `${CURRENCY}${n.toLocaleString('zh-CN')}`
  return [
    { label: t('balance.monthlyIncome'),  value: d ? fmt(d.monthlyIncome)  : '--', color: '#00e5ff', icon: TrendingUp   },
    { label: t('balance.monthlyExpense'), value: d ? fmt(d.monthlyExpense) : '--', color: '#ff4d4d', icon: TrendingDown },
    { label: t('balance.frozen'),         value: d ? fmt(d.frozenAmount)   : '--', color: '#ffb800', icon: Lock         },
  ]
})

// ── Transactions（来自接口）───────────────────────────────────────────────────
const transactions = computed(() => {
  if (!balanceData.value) return []
  return balanceData.value.transactions.map(tx => {
    const meta = CATEGORY_MAP[tx.category] ?? { icon: Banknote, color: '#00e5ff', nameKey: tx.category }
    return {
      id:     tx.id,
      name:   meta.nameKey.startsWith('balance.') ? t(meta.nameKey) : tx.category,
      time:   formatRelativeTime(tx.createdAt),
      type:   tx.type,
      amount: tx.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon:   meta.icon,
      color:  meta.color,
    }
  })
})

// ── Modal ──────────────────────────────────────────────────────────────────
const activeAction = ref<typeof actions.value[0] | null>(null)
const openAction   = (a: typeof actions.value[0]) => { activeAction.value = a }
const handleConfirm = () => { activeAction.value = null }
</script>

<style scoped>
/* ── Reset & Base ─────────────────────────────────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }

.bc-root {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont,
               'PingFang SC', 'Noto Sans SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Orbs ─────────────────────────────────────────────────────────────────── */
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }

.orb-red  { width:480px; height:480px; top:-100px; left:-80px;
            background: var(--orb-red);
            animation: drift 16s ease-in-out infinite; }
.orb-cyan { width:400px; height:400px; top:28%; right:-60px;
            background: var(--orb-cyan);
            animation: drift 20s ease-in-out infinite reverse; }
.orb-amber{ width:340px; height:340px; bottom:8%; left:18%;
            background: var(--orb-amber);
            animation: drift 24s ease-in-out infinite 5s; }

@keyframes drift {
  0%,100% { transform: translate(0,0) scale(1); }
  40%     { transform: translate(24px,-18px) scale(1.05); }
  70%     { transform: translate(-16px,14px) scale(0.96); }
}

/* ── Scroll container ─────────────────────────────────────────────────────── */
.page-scroll {
  position: relative; z-index: 1;
  max-width: 460px; margin: 0 auto; padding: 0 20px 80px;
}

/* ── Glass card ───────────────────────────────────────────────────────────── */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid var(--border);
  border-radius: 20px;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 52px 0 18px;
}
.page-title {
  font-size: 16px; font-weight: 600; letter-spacing: 0.4px;
  color: rgba(255,255,255,0.88);
}
.glass-icon-btn {
  width: 38px; height: 38px; border-radius: 11px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.glass-icon-btn:hover  { background: rgba(255,255,255,0.1); }
.glass-icon-btn:active { transform: scale(0.93); }
</style>

<style scoped>
/* ── Hero Card ────────────────────────────────────────────────────────────── */
.hero-card {
  position: relative; overflow: hidden;
  padding: 26px 24px 20px;
  margin-bottom: 16px;
  animation: breathe 6s ease-in-out infinite;
}

/* 顶部撞色彩条 */
.hero-top-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #ff4d4d 0%, #00e5ff 50%, #ffb800 100%);
  border-radius: 20px 20px 0 0;
}

.hero-glow-red {
  position: absolute; top: -60px; left: -40px;
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,77,77,0.14), transparent 70%);
  pointer-events: none;
}
.hero-glow-cyan {
  position: absolute; top: -40px; right: -30px;
  width: 180px; height: 180px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,229,255,0.1), transparent 70%);
  pointer-events: none;
}

@keyframes breathe {
  0%,100% { box-shadow: 0 0 32px rgba(255,77,77,0.12), 0 0 64px rgba(0,229,255,0.06), 0 6px 24px rgba(0,0,0,0.35); }
  50%     { box-shadow: 0 0 56px rgba(255,77,77,0.22), 0 0 112px rgba(0,229,255,0.12), 0 6px 24px rgba(0,0,0,0.35); }
}

.hero-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 500; letter-spacing: 1px;
  color: rgba(255,255,255,0.38); text-transform: uppercase;
  margin-bottom: 12px;
}

/* ── Digit Roller ─────────────────────────────────────────────────────────── */
.balance-display {
  display: flex; align-items: flex-end; gap: 1px;
  margin-bottom: 10px; line-height: 1;
}
.currency-sym {
  font-size: 24px; font-weight: 300;
  color: rgba(255,255,255,0.4);
  margin-bottom: 5px; margin-right: 3px;
}
.digit-roller-wrap { display: flex; align-items: flex-end; gap: 0; }
.digit-sep {
  font-size: 40px; font-weight: 200;
  color: rgba(255,255,255,0.25); line-height: 1;
  align-self: flex-end; margin-bottom: 3px;
}
.digit-col { height: 52px; overflow: hidden; display: inline-block; }
.digit-strip {
  display: flex; flex-direction: column;
  transition: transform 0.42s cubic-bezier(0.34,1.4,0.64,1);
}
.digit-char {
  height: 52px;
  display: flex; align-items: center; justify-content: center;
  font-size: 44px; font-weight: 700; color: #fff;
  letter-spacing: -1.5px; font-variant-numeric: tabular-nums;
}
.decimal-part {
  font-size: 20px; font-weight: 300;
  color: rgba(255,255,255,0.38); margin-bottom: 5px;
}

.balance-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500;
  color: #00e5ff;
  background: rgba(0,229,255,0.08);
  border: 1px solid rgba(0,229,255,0.18);
  border-radius: 20px; padding: 3px 10px;
  margin-bottom: 18px;
}

.hero-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 16px; }

.hero-bottom { display: flex; align-items: center; }
.hero-stat { flex: 1; }
.hs-label {
  display: block; font-size: 10px; font-weight: 400; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.35); margin-bottom: 4px; text-transform: uppercase;
}
.hs-value { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
.hs-value.amber { color: #ffb800; }
.hs-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.07); margin: 0 18px; }
</style>

<style scoped>
/* ── Actions Row ──────────────────────────────────────────────────────────── */
.actions-row {
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 10px; margin-bottom: 16px;
}
.action-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 16px 6px 14px;
  cursor: pointer; border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.action-card:hover  { transform: translateY(-4px); }
.action-card:active { transform: scale(0.93); }

/* 3D icon */
.action-icon-3d {
  position: relative;
  width: 50px; height: 50px; border-radius: 15px;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  transform: perspective(110px) rotateX(10deg) rotateY(-7deg);
  box-shadow:
    3px 4px 0 rgba(0,0,0,0.35),
    6px 8px 0 rgba(0,0,0,0.18),
    0 0 18px var(--glow);
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
              box-shadow 0.25s;
}
.action-card:hover .action-icon-3d {
  transform: perspective(110px) rotateX(5deg) rotateY(-3deg) translateY(-5px);
  box-shadow:
    5px 8px 0 rgba(0,0,0,0.35),
    10px 16px 0 rgba(0,0,0,0.18),
    0 0 28px var(--glow);
}

/* 高光层 */
.icon-highlight {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 55%);
  pointer-events: none;
}
.icon-face { position: relative; z-index: 1; }

.action-label {
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.65); letter-spacing: 0.3px;
}

/* ── Stats Row ────────────────────────────────────────────────────────────── */
.stats-row {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 10px; margin-bottom: 22px;
}
.stat-card { padding: 14px 13px; display: flex; flex-direction: column; gap: 5px; }

.stat-icon-3d {
  width: 30px; height: 30px; border-radius: 9px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  color: var(--sc);
  transform: perspective(80px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.3), 0 0 10px color-mix(in srgb, var(--sc) 30%, transparent);
  margin-bottom: 2px;
}
.stat-label {
  font-size: 10px; font-weight: 400; letter-spacing: 0.4px;
  color: rgba(255,255,255,0.35); text-transform: uppercase;
}
.stat-value { font-size: 14px; font-weight: 700; }
</style>

<style scoped>
/* ── Transactions ─────────────────────────────────────────────────────────── */
.tx-section { margin-bottom: 20px; }

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 2px;
}
.section-title {
  font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.7);
}
.text-link-btn {
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 500;
  color: rgba(255,77,77,0.8);
  background: none; border: none; cursor: pointer;
  transition: color 0.2s;
}
.text-link-btn:hover { color: #ff4d4d; }

.tx-item {
  display: flex; align-items: center; gap: 13px;
  padding: 13px 15px; margin-bottom: 7px;
  transition: background 0.18s, transform 0.15s;
  cursor: pointer;
}
.tx-item:hover { background: rgba(255,255,255,0.06); transform: translateX(2px); }

/* 3D transaction icon */
.tx-icon-3d {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: var(--tc);
  flex-shrink: 0;
  transform: perspective(80px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.28),
              0 0 12px color-mix(in srgb, var(--tc) 20%, transparent);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tx-item:hover .tx-icon-3d {
  transform: perspective(80px) rotateX(4deg) rotateY(-2deg) translateY(-2px);
  box-shadow: 3px 5px 0 rgba(0,0,0,0.28),
              0 0 18px color-mix(in srgb, var(--tc) 30%, transparent);
}

.tx-info { flex: 1; min-width: 0; }
.tx-name {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.82);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tx-time {
  font-size: 10px; font-weight: 400;
  color: rgba(255,255,255,0.3); margin-top: 3px; letter-spacing: 0.2px;
}
.tx-amount { font-size: 14px; font-weight: 600; flex-shrink: 0; }
.tx-amount.income  { color: #00e5ff; }
.tx-amount.expense { color: #ff4d4d; }
</style>

<style scoped>
/* ── Actions ──────────────────────────────────────────────────────────────── */
.actions-row {
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 10px; margin-bottom: 14px;
}
.action-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 9px; padding: 16px 6px 13px;
  cursor: pointer; border: none;
  transition: transform 0.2s;
}
.action-card:hover  { transform: translateY(-3px); }
.action-card:active { transform: scale(0.92); }

.action-icon-3d {
  position: relative;
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(145deg, var(--c1), var(--c2));
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  transform: perspective(100px) rotateX(10deg) rotateY(-7deg);
  box-shadow:
    3px 4px 0 rgba(0,0,0,0.32),
    6px 8px 0 rgba(0,0,0,0.16),
    0 0 16px var(--glow);
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s;
}
.action-card:hover .action-icon-3d {
  transform: perspective(100px) rotateX(5deg) rotateY(-3deg) translateY(-4px);
  box-shadow:
    5px 7px 0 rgba(0,0,0,0.32),
    10px 14px 0 rgba(0,0,0,0.16),
    0 0 24px var(--glow);
}
.icon-highlight {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.26) 0%, transparent 52%);
  pointer-events: none;
}
.icon-face { position: relative; z-index: 1; }

.action-label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.55);
}

/* ── Stats ────────────────────────────────────────────────────────────────── */
.stats-row {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 10px; margin-bottom: 20px;
}
.stat-card { padding: 14px 12px; display: flex; flex-direction: column; gap: 5px; }

.stat-icon-3d {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: var(--sc);
  transform: perspective(70px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.28), 0 0 8px color-mix(in srgb, var(--sc) 25%, transparent);
  margin-bottom: 2px;
}
.stat-label {
  font-size: 10px; font-weight: 400; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.32); text-transform: uppercase;
}
.stat-value { font-size: 13px; font-weight: 600; }

/* ── Transactions ─────────────────────────────────────────────────────────── */
.tx-section { margin-bottom: 20px; }
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 2px;
}
.section-title {
  font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.55); text-transform: uppercase;
}
.text-link-btn {
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 500;
  color: rgba(255,77,77,0.7);
  background: none; border: none; cursor: pointer;
  transition: color 0.2s;
}
.text-link-btn:hover { color: #ff4d4d; }

.tx-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin-bottom: 6px;
  transition: background 0.18s, transform 0.15s; cursor: pointer;
}
.tx-item:hover { background: rgba(255,255,255,0.05); transform: translateX(2px); }

.tx-icon-3d {
  width: 38px; height: 38px; border-radius: 11px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: var(--tc); flex-shrink: 0;
  transform: perspective(70px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.25), 0 0 10px color-mix(in srgb, var(--tc) 20%, transparent);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tx-item:hover .tx-icon-3d {
  transform: perspective(70px) rotateX(4deg) rotateY(-2deg) translateY(-2px);
  box-shadow: 3px 5px 0 rgba(0,0,0,0.25), 0 0 16px color-mix(in srgb, var(--tc) 30%, transparent);
}

.tx-info { flex: 1; min-width: 0; }
.tx-name {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.78);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tx-time {
  font-size: 10px; font-weight: 400;
  color: rgba(255,255,255,0.28); margin-top: 3px;
}
.tx-amount { font-size: 13px; font-weight: 600; flex-shrink: 0; }
.tx-amount.income  { color: #00e5ff; }
.tx-amount.expense { color: #ff4d4d; }
</style>

<style scoped>
/* ── Actions ──────────────────────────────────────────────────────────────── */
.actions-row {
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 10px; margin-bottom: 14px;
}
.action-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 9px; padding: 16px 6px 13px;
  cursor: pointer; border: none;
  transition: transform 0.2s;
}
.action-card:hover  { transform: translateY(-3px); }
.action-card:active { transform: scale(0.92); }

/* 3D icon */
.action-icon-3d {
  position: relative;
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(145deg, var(--c1), var(--c2));
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  transform: perspective(100px) rotateX(10deg) rotateY(-7deg);
  box-shadow:
    3px 4px 0 rgba(0,0,0,0.32),
    6px 8px 0 rgba(0,0,0,0.16),
    0 0 16px var(--glow);
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s;
}
.action-card:hover .action-icon-3d {
  transform: perspective(100px) rotateX(5deg) rotateY(-3deg) translateY(-4px);
  box-shadow:
    5px 7px 0 rgba(0,0,0,0.32),
    10px 14px 0 rgba(0,0,0,0.16),
    0 0 24px var(--glow);
}
.icon-highlight {
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.26) 0%, transparent 52%);
  pointer-events: none;
}
.icon-face { position: relative; z-index: 1; }
.action-label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.3px;
  color: rgba(255,255,255,0.5);
}

/* ── Stats ────────────────────────────────────────────────────────────────── */
.stats-row {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 10px; margin-bottom: 20px;
}
.stat-card { padding: 14px 12px; display: flex; flex-direction: column; gap: 5px; }
.stat-icon-3d {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: var(--sc);
  transform: perspective(70px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.28), 0 0 8px color-mix(in srgb, var(--sc) 25%, transparent);
  margin-bottom: 2px;
}
.stat-label {
  font-size: 10px; font-weight: 400; letter-spacing: 0.5px;
  color: rgba(255,255,255,0.32); text-transform: uppercase;
}
.stat-value { font-size: 13px; font-weight: 600; }

/* ── Transactions ─────────────────────────────────────────────────────────── */
.tx-section { margin-bottom: 20px; }
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 2px;
}
.section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.8px;
  color: rgba(255,255,255,0.45); text-transform: uppercase;
}
.text-link-btn {
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 500;
  color: rgba(255,77,77,0.7);
  background: none; border: none; cursor: pointer;
  transition: color 0.2s;
}
.text-link-btn:hover { color: #ff4d4d; }

.tx-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin-bottom: 6px;
  transition: background 0.18s, transform 0.15s; cursor: pointer;
}
.tx-item:hover { background: rgba(255,255,255,0.04); transform: translateX(2px); }

.tx-icon-3d {
  width: 38px; height: 38px; border-radius: 11px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: var(--tc); flex-shrink: 0;
  transform: perspective(70px) rotateX(8deg) rotateY(-5deg);
  box-shadow: 2px 3px 0 rgba(0,0,0,0.25), 0 0 10px color-mix(in srgb, var(--tc) 20%, transparent);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tx-item:hover .tx-icon-3d {
  transform: perspective(70px) rotateX(4deg) rotateY(-2deg) translateY(-2px);
  box-shadow: 3px 5px 0 rgba(0,0,0,0.25), 0 0 16px color-mix(in srgb, var(--tc) 30%, transparent);
}

.tx-info { flex: 1; min-width: 0; }
.tx-name {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.78);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tx-time {
  font-size: 10px; font-weight: 400;
  color: rgba(255,255,255,0.28); margin-top: 3px;
}
.tx-amount { font-size: 13px; font-weight: 600; flex-shrink: 0; }
.tx-amount.income  { color: #00e5ff; }
.tx-amount.expense { color: #ff4d4d; }
</style>
