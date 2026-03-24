<template>
  <div class="vip-root">
    <div class="bg-canvas">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <div class="vip-scroll">
      <div class="hero-section">
        <div class="hero-badge">
          <div class="badge-ring">
            <Crown :size="38" class="badge-icon" />
          </div>
          <div class="lv-chip">{{ vipInfo?.label || 'LV0' }}</div>
        </div>
        <div class="hero-name">VIP</div>
        <div class="hero-total">
          累计购买产品数 <strong>{{ vipInfo?.totalBuyCount ?? 0 }}</strong>
        </div>
      </div>

      <div class="section-card xp-card">
        <div class="xp-row">
          <span class="xp-label">当前购买数据</span>
          <span class="xp-val">{{ vipInfo?.currentBuyCount ?? 0 }}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="xp-hint" v-if="vipInfo?.nextBuyCount">距下一级还差 {{ vipInfo.nextNeed }}</div>
        <div class="xp-hint" v-else>已达最高等级</div>
      </div>

      <div class="section-card">
        <div class="section-title">专属特权</div>
        <div class="priv-grid">
          <div class="priv-item">
            <div class="priv-title">VIP可领奖励</div>
            <div class="priv-desc">每日可领取 {{ vipInfo?.rewardMoney ?? 0 }} XAF</div>
          </div>
          <div class="priv-item team-jump" @click="router.push('/team')">
            <div class="priv-title">我的团队</div>
            <div class="priv-desc">查看团队成员与团队数据</div>
          </div>
        </div>
      </div>

      <div class="section-card history-card">
        <div class="section-title">购买记录</div>
        <div class="history-list">
          <div class="history-item" v-for="rec in buyList" :key="rec.id">
            <div class="hist-info">
              <div class="hist-source">{{ rec.name }}</div>
              <div class="hist-time">{{ formatTime(rec.createdAt) }}</div>
            </div>
            <div class="hist-xp">{{ rec.amount.toLocaleString() }} XAF</div>
          </div>
          <div v-if="buyList.length === 0 && !loading" class="hist-empty">暂无记录</div>
        </div>
      </div>

      <div class="bottom-pad"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Crown } from 'lucide-vue-next'
import { fetchVipInfo, fetchVipBuyLog } from '@/api/vip'
import type { VipInfo, BuyRecord } from '@/types/vip'

const router = useRouter()

const vipInfo = ref<VipInfo | null>(null)
const buyList = ref<BuyRecord[]>([])
const loading = ref(true)

const progressPct = computed(() => {
  if (!vipInfo.value) return 0
  if (!vipInfo.value.nextBuyCount) return 100
  return Math.min(100, Math.round((vipInfo.value.currentBuyCount / vipInfo.value.nextBuyCount) * 100))
})

function formatTime(iso: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}

onMounted(async () => {
  try {
    const [info, logs] = await Promise.all([fetchVipInfo(), fetchVipBuyLog()])
    vipInfo.value = info
    buyList.value = logs
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.vip-root {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); }
.orb-1 { width: 500px; height: 500px; top: -100px; right: -100px; background: var(--orb-amber); }
.orb-2 { width: 360px; height: 360px; bottom: 80px; left: -80px; background: var(--orb-cyan); opacity: 0.35; }

.vip-scroll {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding-bottom: 80px;
}

.hero-section {
  padding: 56px 24px 36px;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.badge-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-amber), var(--color-red));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(255, 184, 0, 0.35), 0 8px 32px rgba(0,0,0,0.4);
}

.badge-icon { color: rgba(255,255,255,0.95); }

.lv-chip {
  background: linear-gradient(135deg, var(--color-amber), var(--color-red));
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.hero-name {
  margin-top: 16px;
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
}

.hero-total {
  margin-top: 8px;
  font-size: 13px;
  color: color-mix(in srgb, var(--text-primary) 55%, transparent);
}

.hero-total strong { color: var(--text-primary); }

.section-card {
  margin: 0 16px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
}

.xp-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.xp-label { font-size: 13px; color: color-mix(in srgb, var(--text-primary) 55%, transparent); }
.xp-val { font-size: 20px; font-weight: 700; color: var(--text-primary); }

.progress-track {
  height: 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.8s;
  background: linear-gradient(90deg, var(--color-cyan), var(--color-lime));
}

.xp-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--text-primary) 45%, transparent);
  text-align: right;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: color-mix(in srgb, var(--text-primary) 55%, transparent);
  margin-bottom: 16px;
}

.priv-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.priv-item {
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
  border-radius: 12px;
  padding: 12px;
}

.team-jump { cursor: pointer; }

.priv-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.priv-desc { font-size: 12px; color: color-mix(in srgb, var(--text-primary) 55%, transparent); }

.history-list { display: flex; flex-direction: column; gap: 2px; }

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
}

.history-item:last-child { border-bottom: none; }

.hist-info { flex: 1; min-width: 0; }
.hist-source { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.hist-time { font-size: 11px; color: color-mix(in srgb, var(--text-primary) 45%, transparent); margin-top: 2px; }

.hist-xp { font-size: 14px; font-weight: 700; color: var(--color-lime); flex-shrink: 0; }

.hist-empty {
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--text-primary) 35%, transparent);
}

.bottom-pad { height: 20px; }
</style>
