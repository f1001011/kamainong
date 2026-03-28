<template>
  <div class="withdraw-desktop">
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
        <p>Withdraw</p>
        <h1>桌面端把提现页做成单栏表单加侧边说明，降低视觉噪音，先保留最轻量流程。</h1>
        <span>本轮继续只保留字母数字输入和提交反馈，等你后续给真实字段再扩表单。</span>
      </div>
    </section>

    <section class="content-grid">
      <section
        v-motion
        class="form-panel"
        :initial="{ opacity: 0, x: -18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 70 } }"
      >
        <div class="panel-head">
          <Wallet :size="18" />
          <strong>提现账号</strong>
        </div>

        <label class="field-block">
          <span>输入字母或数字</span>
          <input
            v-model="account"
            type="text"
            inputmode="text"
            placeholder="请输入字母或数字"
            @input="sanitize"
          />
        </label>

        <button class="submit-btn" @click="submit">提交</button>
        <p v-if="message" class="message">{{ message }}</p>
      </section>

      <aside
        v-motion
        class="guide-panel"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 100 } }"
      >
        <div class="guide-head">
          <ShieldCheck :size="18" />
          <strong>当前规则</strong>
        </div>

        <article class="guide-item">仅允许字母和数字，输入中会自动过滤其它字符。</article>
        <article class="guide-item">提交后先显示前端演示反馈，后续接接口时保留相同交互结构。</article>
        <article class="guide-item">PC 页面以操作集中为主，不会做成复杂后台表单。</article>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-vue-next'

const router = useRouter()
const account = ref('')
const message = ref('')

function sanitize() {
  account.value = account.value.replace(/[^a-zA-Z0-9]/g, '')
}

function submit() {
  sanitize()
  message.value = account.value ? `已提交：${account.value}` : '请先输入字母数字账号。'
}
</script>

<style scoped>
.withdraw-desktop {
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
  max-width: 860px;
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
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.76fr);
  gap: 20px;
}

.form-panel,
.guide-panel {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  box-shadow: var(--wc-shadow-card);
}

.form-panel {
  padding: 24px;
  background: var(--wc-surface-elevated);
}

.guide-panel {
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.93));
  color: var(--wc-text-on-dark);
}

.panel-head,
.guide-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.panel-head strong {
  color: var(--wc-text);
  font-size: 18px;
}

.field-block {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.field-block span {
  color: var(--wc-text-soft);
  font-size: 14px;
}

.field-block input {
  height: 56px;
  border: 1px solid var(--wc-border-strong);
  border-radius: 18px;
  padding: 0 18px;
  background: #fff;
  color: var(--wc-text);
  font-size: 16px;
  outline: none;
}

.field-block input:focus {
  border-color: rgba(125, 196, 244, 0.8);
  box-shadow: 0 0 0 4px rgba(125, 196, 244, 0.16);
}

.submit-btn {
  width: 100%;
  margin-top: 16px;
  height: 56px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--wc-gold-soft), var(--wc-blue));
  color: var(--wc-bg);
  font-size: 15px;
  font-weight: 800;
}

.message {
  margin: 14px 0 0;
  color: var(--wc-text-soft);
}

.guide-item {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}
</style>
