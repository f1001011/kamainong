<template>
  <div class="vip-root">
    <!-- 背景 -->
    <div class="bg-canvas">
      <div class="orb orb-1" :style="{ background: levelColor.orbBg }"></div>
      <div class="orb orb-2"></div>
    </div>

    <div class="vip-scroll">
      <!-- ── Hero ── -->
      <div class="hero-section"
        :style="{ '--lv-from': levelColor.from, '--lv-to': levelColor.to, '--lv-glow': levelColor.glow }">
        <div class="hero-badge"
          v-motion :initial="{ opacity:0, scale:0.5 }"
          :enter="{ opacity:1, scale:1, transition:{ type:'spring', stiffness:200, damping:18 } }">
          <div class="badge-ring">
            <Crown :size="38" class="badge-icon" />
          </div>
          <div class="lv-chip">LV.{{ vipInfo?.level ?? 0 }}</div>
        </div>
        <div class="hero-name"
          v-motion :initial="{ opacity:0, y:16 }"
          :enter="{ opacity:1, y:0, transition:{ delay:80 } }">
          {{ levelName }}
        </div>
        <div class="hero-total"
          v-motion :initial="{ opacity:0 }"
          :enter="{ opacity:1, transition:{ delay:160 } }">
          {{ t('vip.totalXp') }}&nbsp;
          <strong>{{ vipInfo?.totalXp.toLocaleString() ?? '—' }}</strong>&nbsp;{{ t('vip.xpUnit') }}
        </div>
      </div>

      <!-- ── XP 进度卡 ── -->
      <div class="section-card xp-card"
        v-motion :initial="{ opacity:0, y:28 }"
        :enter="{ opacity:1, y:0, transition:{ delay:120, type:'spring', stiffness:160, damping:20 } }">
        <div class="xp-row">
          <span class="xp-label">{{ t('vip.currentXp') }}</span>
          <span class="xp-val">
            {{ vipInfo?.currentXp.toLocaleString() ?? '—' }}
            <small v-if="vipInfo?.nextLevelXp"> / {{ vipInfo.nextLevelXp.toLocaleString() }}</small>
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"
            :style="{ width: progressPct + '%', background: `linear-gradient(90deg,${levelColor.from},${levelColor.to})` }">
          </div>
        </div>
        <div class="xp-hint">
          <span v-if="vipInfo?.nextLevelXp">
            {{ t('vip.nextLevel', { n: (vipInfo.nextLevelXp - vipInfo.currentXp).toLocaleString() }) }}
          </span>
          <span v-else>{{ t('vip.maxLevel') }}</span>
        </div>
      </div>

      <!-- ── 等级之路 ── -->
      <div class="section-card"
        v-motion :initial="{ opacity:0, y:28 }"
        :enter="{ opacity:1, y:0, transition:{ delay:200, type:'spring', stiffness:160, damping:20 } }">
        <div class="section-title">{{ t('vip.levelRoad') }}</div>
        <div class="level-road-wrap" ref="roadRef">
          <div class="level-road">
            <template v-for="(lc, i) in LEVEL_COLORS" :key="i">
              <div class="road-node"
                :class="{ active: i === (vipInfo?.level ?? 0), passed: i < (vipInfo?.level ?? 0) }"
                :style="{ '--nc-from': lc.from, '--nc-to': lc.to, '--nc-glow': lc.glow }">
                <div class="node-circle">
                  <Crown v-if="i >= 6" :size="11" />
                  <span v-else>{{ i }}</span>
                </div>
                <div class="node-label">{{ levelNames[i] }}</div>
              </div>
              <div v-if="i < 9" class="road-line"
                :class="{ passed: i < (vipInfo?.level ?? 0) }"
                :style="i < (vipInfo?.level ?? 0) ? { background: `linear-gradient(90deg,${LEVEL_COLORS[i].to},${LEVEL_COLORS[i+1].from})` } : {}">
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ── 专属特权 ── -->
      <div class="section-card"
        v-motion :initial="{ opacity:0, y:28 }"
        :enter="{ opacity:1, y:0, transition:{ delay:260, type:'spring', stiffness:160, damping:20 } }">
        <div class="section-title">{{ t('vip.privileges') }}</div>
        <div class="priv-grid">
          <div class="priv-item" v-for="p in PRIVS" :key="p.key">
            <div class="priv-icon-wrap" :style="{ background: p.bg }">
              <component :is="p.icon" :size="20" :style="{ color: p.color }" />
            </div>
            <div class="priv-text">
              <div class="priv-title">{{ t(`vip.priv.${p.key}.title`) }}</div>
              <div class="priv-desc">{{ t(`vip.priv.${p.key}.desc`) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 经验记录 ── -->
      <div class="section-card history-card"
        v-motion :initial="{ opacity:0, y:28 }"
        :enter="{ opacity:1, y:0, transition:{ delay:320, type:'spring', stiffness:160, damping:20 } }">
        <div class="section-title">{{ t('vip.xpHistory') }}</div>
        <div class="history-list">
          <div class="history-item" v-for="rec in xpList" :key="rec.id">
            <div class="hist-icon-wrap" :style="{ background: sourceStyle(rec.sourceKey).bg }">
              <component :is="sourceStyle(rec.sourceKey).icon" :size="16"
                :style="{ color: sourceStyle(rec.sourceKey).color }" />
            </div>
            <div class="hist-info">
              <div class="hist-source">{{ t(`vip.source.${rec.sourceKey}`) }}</div>
              <div class="hist-time">{{ formatTime(rec.createdAt) }}</div>
            </div>
            <div class="hist-xp">+{{ rec.xp }}<small>&nbsp;{{ t('vip.xpUnit') }}</small></div>
          </div>
          <div v-if="xpList.length === 0 && !histLoading" class="hist-empty">暂无记录</div>
        </div>
        <div ref="sentinelRef" class="sentinel">
          <Loader2 v-if="histLoading" :size="18" class="spinner" />
          <span v-else-if="!hasMore" class="no-more">{{ t('vip.noMore') }}</span>
        </div>
      </div>

      <div class="bottom-pad"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Crown, Wallet, ShoppingBag, CalendarDays, UserPlus, CheckCircle2,
  Loader2, Percent, Headphones, Gift, ShieldCheck
} from 'lucide-vue-next'
import { fetchVipInfo, fetchVipXpHistory } from '@/api/vip'
import type { VipInfo, XpRecord } from '@/types/vip'

const { t, tm } = useI18n()

// ── 等级颜色配置 ──────────────────────────────────────────────────────────────
const LEVEL_COLORS = [
  { from:'#6b7280', to:'#9ca3af', glow:'rgba(156,163,175,0.35)', orbBg:'radial-gradient(circle,rgba(156,163,175,0.25),transparent)' },
  { from:'#92400e', to:'#cd7f32', glow:'rgba(205,127,50,0.4)',   orbBg:'radial-gradient(circle,rgba(205,127,50,0.28),transparent)' },
  { from:'#6b7280', to:'#d1d5db', glow:'rgba(209,213,219,0.4)',  orbBg:'radial-gradient(circle,rgba(209,213,219,0.22),transparent)' },
  { from:'#92400e', to:'#ffd700', glow:'rgba(255,215,0,0.45)',   orbBg:'radial-gradient(circle,rgba(255,215,0,0.28),transparent)' },
  { from:'#475569', to:'#e2e8f0', glow:'rgba(226,232,240,0.4)',  orbBg:'radial-gradient(circle,rgba(226,232,240,0.22),transparent)' },
  { from:'#0891b2', to:'#67e8f9', glow:'rgba(103,232,249,0.5)',  orbBg:'radial-gradient(circle,rgba(103,232,249,0.28),transparent)' },
  { from:'#78350f', to:'#d97706', glow:'rgba(217,119,6,0.45)',   orbBg:'radial-gradient(circle,rgba(217,119,6,0.28),transparent)' },
  { from:'#7c3aed', to:'#c084fc', glow:'rgba(192,132,252,0.5)',  orbBg:'radial-gradient(circle,rgba(192,132,252,0.28),transparent)' },
  { from:'#dc2626', to:'#f87171', glow:'rgba(248,113,113,0.5)',  orbBg:'radial-gradient(circle,rgba(248,113,113,0.28),transparent)' },
  { from:'#ea580c', to:'#fb923c', glow:'rgba(251,146,60,0.55)',  orbBg:'radial-gradient(circle,rgba(251,146,60,0.32),transparent)' },
]

const PRIVS = [
  { key:'discount', icon:Percent,     color:'#ffd700', bg:'rgba(255,215,0,0.12)' },
  { key:'service',  icon:Headphones,  color:'#67e8f9', bg:'rgba(103,232,249,0.12)' },
  { key:'gift',     icon:Gift,        color:'#c084fc', bg:'rgba(192,132,252,0.12)' },
  { key:'protect',  icon:ShieldCheck, color:'#4ade80', bg:'rgba(74,222,128,0.12)' },
]

const SOURCE_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  recharge: { icon:Wallet,        color:'#ffd700', bg:'rgba(255,215,0,0.12)' },
  purchase: { icon:ShoppingBag,   color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  signin:   { icon:CalendarDays,  color:'#4ade80', bg:'rgba(74,222,128,0.12)' },
  invite:   { icon:UserPlus,      color:'#67e8f9', bg:'rgba(103,232,249,0.12)' },
  task:     { icon:CheckCircle2,  color:'#c084fc', bg:'rgba(192,132,252,0.12)' },
}

// ── State ─────────────────────────────────────────────────────────────────────
const vipInfo     = ref<VipInfo | null>(null)
const xpList      = ref<XpRecord[]>([])
const page        = ref(1)
const hasMore     = ref(true)
const histLoading = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
const roadRef     = ref<HTMLElement | null>(null)

// ── Computed ──────────────────────────────────────────────────────────────────
const levelColor  = computed(() => LEVEL_COLORS[vipInfo.value?.level ?? 0])
const levelNames  = computed(() => tm('vip.levelNames') as string[])
const levelName   = computed(() => levelNames.value[vipInfo.value?.level ?? 0] ?? '')
const progressPct = computed(() => {
  if (!vipInfo.value || !vipInfo.value.nextLevelXp) return 100
  return Math.min(100, Math.round((vipInfo.value.currentXp / vipInfo.value.nextLevelXp) * 100))
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function sourceStyle(key: string) {
  return SOURCE_STYLES[key] ?? SOURCE_STYLES.task
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1)  return `${Math.floor(diff / 60_000)} 分钟前`
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
async function loadVipInfo() {
  vipInfo.value = await fetchVipInfo()
  await nextTick()
  const wrap = roadRef.value
  if (wrap) {
    const active = wrap.querySelector('.road-node.active') as HTMLElement | null
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

async function loadMore() {
  if (histLoading.value || !hasMore.value) return
  histLoading.value = true
  try {
    const res = await fetchVipXpHistory({ page: page.value, pageSize: 10 })
    xpList.value.push(...res.list)
    hasMore.value = res.hasMore
    page.value++
  } finally {
    histLoading.value = false
  }
}

// ── IntersectionObserver ──────────────────────────────────────────────────────
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await loadVipInfo()
  await loadMore()
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore()
  }, { threshold: 0.1 })
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

onUnmounted(() => { observer?.disconnect() })
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vip-root {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
  font-family: 'Inter','SF Pro Text',-apple-system,'PingFang SC','Noto Sans SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── 背景 ── */
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); }
.orb-1 { width: 500px; height: 500px; top: -100px; right: -100px; transition: background 0.8s ease; }
.orb-2 { width: 360px; height: 360px; bottom: 80px; left: -80px; background: var(--orb-amber); opacity: 0.35; animation: drift 22s ease-in-out infinite; }
@keyframes drift {
  0%,100% { transform: translate(0,0) scale(1); }
  40%     { transform: translate(18px,-14px) scale(1.04); }
  70%     { transform: translate(-12px,10px) scale(0.97); }
}

/* ── 滚动容器 ── */
.vip-scroll {
  position: relative; z-index: 1;
  height: 100vh; overflow-y: auto;
  padding-bottom: 80px;
}
.vip-scroll::-webkit-scrollbar { display: none; }

/* ── Hero ── */
.hero-section {
  padding: 56px 24px 36px;
  text-align: center;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, var(--bg-base) 100%);
  position: relative;
}
.hero-section::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 0%, var(--lv-glow, rgba(255,215,0,0.2)), transparent);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex; flex-direction: column; align-items: center; gap: 8px;
  position: relative;
}
.badge-ring {
  width: 96px; height: 96px; border-radius: 50%;
  background: linear-gradient(135deg, var(--lv-from), var(--lv-to));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px var(--lv-glow, rgba(255,215,0,0.4)), 0 8px 32px rgba(0,0,0,0.4);
  position: relative;
}
.badge-ring::before {
  content: '';
  position: absolute; inset: -3px; border-radius: 50%;
  background: linear-gradient(135deg, var(--lv-from), var(--lv-to));
  opacity: 0.4; filter: blur(8px);
}
.badge-icon { color: rgba(255,255,255,0.95); position: relative; z-index: 1; }

.lv-chip {
  background: linear-gradient(135deg, var(--lv-from), var(--lv-to));
  color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px;
  padding: 3px 10px; border-radius: 20px;
  box-shadow: 0 2px 10px var(--lv-glow, rgba(255,215,0,0.4));
}

.hero-name {
  margin-top: 16px;
  font-size: 26px; font-weight: 800; letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--lv-from), var(--lv-to));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-total {
  margin-top: 8px;
  font-size: 13px; color: rgba(255,255,255,0.4); letter-spacing: 0.3px;
}
.hero-total strong { color: rgba(255,255,255,0.75); font-weight: 600; }

/* ── 通用卡片 ── */
.section-card {
  margin: 0 16px 14px;
  background: var(--bg-card);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
}
.section-title {
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.45); letter-spacing: 0.8px;
  text-transform: uppercase; margin-bottom: 16px;
}

/* ── XP 进度 ── */
.xp-row {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 12px;
}
.xp-label { font-size: 13px; color: rgba(255,255,255,0.45); }
.xp-val   { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.9); }
.xp-val small { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.35); }

.progress-track {
  height: 8px; border-radius: 8px;
  background: rgba(255,255,255,0.08);
  overflow: hidden; margin-bottom: 10px;
}
.progress-fill {
  height: 100%; border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 0 10px rgba(255,255,255,0.2);
}
.xp-hint { font-size: 12px; color: rgba(255,255,255,0.3); text-align: right; }

/* ── 等级之路 ── */
.level-road-wrap {
  overflow-x: auto; padding-bottom: 4px;
}
.level-road-wrap::-webkit-scrollbar { display: none; }
.level-road {
  display: flex; align-items: center;
  padding: 4px 8px 8px; min-width: max-content;
}

.road-node {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.node-circle {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 2px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.3);
  transition: all 0.3s ease;
}
.road-node.passed .node-circle {
  background: linear-gradient(135deg, var(--nc-from), var(--nc-to));
  border-color: transparent;
  color: rgba(255,255,255,0.9);
}
.road-node.active .node-circle {
  background: linear-gradient(135deg, var(--nc-from), var(--nc-to));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 0 18px var(--nc-glow), 0 4px 12px rgba(0,0,0,0.3);
  transform: scale(1.18);
}
.node-label {
  font-size: 10px; color: rgba(255,255,255,0.25);
  white-space: nowrap; letter-spacing: 0.2px;
  transition: color 0.3s;
}
.road-node.active .node-label  { color: rgba(255,255,255,0.75); font-weight: 600; }
.road-node.passed .node-label  { color: rgba(255,255,255,0.45); }

.road-line {
  width: 28px; height: 2px; flex-shrink: 0;
  background: rgba(255,255,255,0.1);
  border-radius: 2px; margin-bottom: 22px;
  transition: background 0.3s;
}

/* ── 特权网格 ── */
.priv-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.priv-item {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px; padding: 14px 12px;
}
.priv-icon-wrap {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.priv-text { flex: 1; min-width: 0; }
.priv-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 4px; }
.priv-desc  { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.4; }

/* ── 经验记录 ── */
.history-list { display: flex; flex-direction: column; gap: 2px; }

.history-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.history-item:last-child { border-bottom: none; }

.hist-icon-wrap {
  width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.hist-info { flex: 1; min-width: 0; }
.hist-source { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.82); }
.hist-time   { font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 2px; }

.hist-xp {
  font-size: 16px; font-weight: 700;
  color: #4ade80; flex-shrink: 0;
}
.hist-xp small { font-size: 10px; font-weight: 400; color: rgba(74,222,128,0.6); }

.hist-empty {
  text-align: center; padding: 32px 0;
  font-size: 13px; color: rgba(255,255,255,0.2);
}

/* ── Sentinel / 加载更多 ── */
.sentinel {
  display: flex; align-items: center; justify-content: center;
  min-height: 44px; padding: 8px 0;
}
.spinner { animation: spin 0.8s linear infinite; color: rgba(255,255,255,0.3); }
@keyframes spin { to { transform: rotate(360deg); } }
.no-more { font-size: 12px; color: rgba(255,255,255,0.2); letter-spacing: 0.5px; }

.bottom-pad { height: 20px; }
</style>
