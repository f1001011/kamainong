<template>
  <div class="honey-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <span>{{ resolve(config.title) }}</span>
    </header>

    <main class="page-content">
      <section class="hero-card">
        <p class="hero-kicker">{{ config.kicker }}</p>
        <h1>{{ resolve(config.title) }}</h1>
        <p class="hero-copy">{{ resolve(config.description) }}</p>
        <div v-if="config.primaryAction || config.secondaryAction" class="hero-actions">
          <button v-if="config.primaryAction" class="primary-btn" @click="go(config.primaryAction.to)">
            {{ config.primaryAction.label }}
          </button>
          <button v-if="config.secondaryAction" class="secondary-btn" @click="go(config.secondaryAction.to)">
            {{ config.secondaryAction.label }}
          </button>
        </div>
      </section>

      <section v-if="config.metrics?.length" class="metrics-grid">
        <article v-for="metric in config.metrics" :key="metric.label" class="metric-card">
          <span>{{ resolve(metric.label) }}</span>
          <strong :class="{ accent: metric.tone === 'accent' }">{{ resolve(metric.value) }}</strong>
        </article>
      </section>

      <section v-if="config.fields?.length" class="panel-card form-card">
        <div v-for="field in config.fields" :key="field.label" class="field-row">
          <span>{{ resolve(field.label) }}</span>
          <input :placeholder="resolve(field.placeholder)" />
          <small v-if="field.note">{{ resolve(field.note) }}</small>
        </div>
      </section>

      <section v-if="config.cards?.length" class="cards-grid">
        <article v-for="card in config.cards" :key="card.title" class="panel-card clickable" @click="card.to && go(card.to)">
          <div class="card-head">
            <span v-if="card.badge" class="card-badge">{{ resolve(card.badge) }}</span>
            <strong>{{ resolve(card.title) }}</strong>
          </div>
          <p>{{ resolve(card.body) }}</p>
          <small v-if="card.value">{{ resolve(card.value) }}</small>
        </article>
      </section>

      <section v-if="config.records?.length" class="panel-card record-card">
        <article v-for="record in config.records" :key="record.title + record.value" class="record-row">
          <div>
            <strong>{{ resolve(record.title) }}</strong>
            <small v-if="record.meta">{{ resolve(record.meta) }}</small>
          </div>
          <span>{{ resolve(record.value) }}</span>
        </article>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { honeywellPageConfigs } from '@/config/honeywellPageConfigs'

const route = useRoute()
const router = useRouter()

const config = computed(() => {
  const key = String(route.name || '')
  return honeywellPageConfigs[key] || {
    kicker: 'Honeywell Migration',
    title: 'Page Not Configured',
    description: 'This route has not been mapped yet.',
  }
})

function resolve(value: string) {
  return value.replace(/\{id\}/g, String(route.params.id || '--'))
}

function go(path?: string) {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.honey-page {
  min-height: 100vh;
  background: #fafaf7;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 18;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  background: rgba(250, 250, 247, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: rgba(13, 107, 61, 0.08);
  color: #17392a;
  font-size: 28px;
}

.page-header span {
  color: #17392a;
  font-size: 16px;
  font-weight: 700;
}

.page-content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 18px 16px 96px;
}

.hero-card,
.metric-card,
.panel-card {
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
}

.hero-card {
  padding: 28px;
  background: linear-gradient(135deg, #17392a, #0d6b3d);
  color: #fff;
}

.hero-kicker {
  margin: 0 0 10px;
  color: rgba(208, 172, 115, 0.9);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.hero-card h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 44px);
}

.hero-copy {
  margin: 14px 0 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.primary-btn,
.secondary-btn {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 700;
}

.primary-btn {
  background: linear-gradient(135deg, #d0ac73, #8f6c3a);
  color: #111;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.metrics-grid,
.cards-grid {
  margin-top: 18px;
  display: grid;
  gap: 14px;
}

.metrics-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  padding: 20px;
}

.metric-card span,
.panel-card p,
.field-row span,
.record-row small {
  color: rgba(23, 57, 42, 0.58);
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #17392a;
  font-size: 26px;
}

.metric-card strong.accent {
  color: #8f6c3a;
}

.form-card,
.record-card {
  margin-top: 18px;
  padding: 20px;
}

.field-row + .field-row,
.record-row + .record-row {
  margin-top: 14px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-row input {
  height: 50px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  background: #f7f5ef;
  padding: 0 16px;
}

.field-row small {
  color: #8f6c3a;
}

.cards-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.clickable {
  cursor: pointer;
}

.panel-card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.card-badge {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(13, 107, 61, 0.08);
  color: #0d6b3d;
  font-size: 11px;
  font-weight: 700;
}

.card-head strong,
.record-row strong,
.record-row span,
.panel-card small {
  color: #17392a;
}

.panel-card p {
  margin: 0;
  line-height: 1.8;
}

.panel-card small {
  display: block;
  margin-top: 10px;
  color: #8f6c3a;
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.record-row strong,
.record-row small,
.record-row span {
  display: block;
}

.record-row span {
  font-weight: 700;
}

@media (max-width: 900px) {
  .metrics-grid,
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
