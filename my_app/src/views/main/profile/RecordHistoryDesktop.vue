<template>
  <div class="records-desktop">
    <section
      v-motion
      class="hero-panel"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="18" />
      </button>

      <div class="hero-copy">
        <p>Records</p>
        <h1>{{ pageTitle }}</h1>
        <span>桌面端把历史页拆成左侧概览和右侧列表，分页追加逻辑和移动端保持一致。</span>
      </div>
    </section>

    <section class="content-grid">
      <aside
        v-motion
        class="summary-panel"
        :initial="{ opacity: 0, x: -18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 70 } }"
      >
        <div class="summary-chip">
          <FolderClock :size="16" />
          <span>{{ typeLabel }}</span>
        </div>

        <h2>当前已加载 {{ loadedCount }} / {{ totalCount || loadedCount }} 条记录</h2>
        <p>滚动到页面底部会继续追加下一页 mock 数据，后续替换真实接口时可以沿用同一套分页入口。</p>

        <div class="legend-list">
          <article>
            <span class="dot ok"></span>
            <strong>已完成 / 已到账 / 已结算</strong>
          </article>
          <article>
            <span class="dot pending"></span>
            <strong>处理中 / 进行中</strong>
          </article>
          <article>
            <span class="dot warn"></span>
            <strong>已拒绝 / 已取消</strong>
          </article>
        </div>
      </aside>

      <section
        v-motion
        class="list-panel"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 100 } }"
      >
        <article v-for="item in items" :key="item.id" class="record-row">
          <div class="row-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.time }}</small>
          </div>

          <div class="row-amount">{{ item.amount }}</div>
          <div class="row-status">
            <em :class="statusClass(item.status)">{{ item.status }}</em>
          </div>
        </article>

        <div v-if="isLoading" class="list-state">加载中...</div>
        <div v-else-if="isFinished" class="list-state">已经到底了</div>
      </section>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FolderClock } from 'lucide-vue-next'
import { useRecordHistory } from '@/composables/useRecordHistory'

const router = useRouter()
const { items, isLoading, isFinished, recordType, pageTitle, loadedCount, totalCount, statusClass } =
  useRecordHistory()

const typeLabel = computed(() => {
  if (recordType.value === 'recharge') return '充值记录'
  if (recordType.value === 'withdraw') return '提现记录'
  return '下注记录'
})
</script>

<style scoped>
.records-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 240px),
    var(--wc-surface);
}

.hero-panel,
.content-grid {
  max-width: 1400px;
  margin: 0 auto;
}

.hero-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: flex-start;
}

.back-btn {
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(11, 31, 23, 0.92);
  color: var(--wc-text-on-dark);
  box-shadow: 0 16px 36px rgba(10, 27, 19, 0.12);
}

.hero-copy p {
  margin: 0 0 10px;
  color: var(--wc-green-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  color: var(--wc-text);
  font-size: 42px;
  line-height: 1.12;
}

.hero-copy span {
  display: block;
  margin-top: 14px;
  color: var(--wc-text-soft);
  line-height: 1.7;
}

.content-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(320px, 0.76fr) minmax(0, 1.24fr);
  gap: 20px;
}

.summary-panel,
.list-panel {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.summary-panel {
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.93));
  color: var(--wc-text-on-dark);
}

.summary-chip {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
  font-weight: 700;
}

.summary-panel h2 {
  margin: 18px 0 0;
  font-size: 30px;
  line-height: 1.2;
}

.summary-panel p {
  margin: 14px 0 0;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.legend-list {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.legend-list article {
  padding: 14px 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.dot.ok {
  background: #3ac26a;
}

.dot.pending {
  background: #4aa8ef;
}

.dot.warn {
  background: #e0a245;
}

.list-panel {
  padding: 8px 20px;
  background: var(--wc-surface-elevated);
}

.record-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 20px;
  align-items: center;
  padding: 18px 0;
}

.record-row + .record-row {
  border-top: 1px solid var(--wc-border);
}

.row-main strong,
.row-main small {
  display: block;
}

.row-main strong {
  color: var(--wc-text);
  font-size: 17px;
}

.row-main small {
  margin-top: 7px;
  color: var(--wc-text-soft);
}

.row-amount {
  color: var(--wc-text);
  font-weight: 700;
  white-space: nowrap;
}

.row-status em {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.row-status em.ok {
  color: #1f8a4d;
}

.row-status em.pending {
  color: #2f82bd;
}

.row-status em.warn {
  color: #ba7a2c;
}

.list-state {
  padding: 22px 0 16px;
  text-align: center;
  color: var(--wc-text-soft);
}
</style>
