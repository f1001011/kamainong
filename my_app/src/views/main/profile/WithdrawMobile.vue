<template>
  <div class="sub-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <div>
        <p>提现</p>
        <h1>提交提现账号</h1>
      </div>
    </header>

    <section class="form-card">
      <div class="field-head">
        <strong>仅保留字母数字输入</strong>
        <span>先保留最轻量的提现流程，方便后续替换成真实表单。</span>
      </div>

      <input
        v-model="account"
        type="text"
        inputmode="text"
        placeholder="请输入字母或数字"
        @input="sanitize"
      />

      <button class="submit-btn" @click="submit">提交</button>
      <p v-if="message" class="message">{{ message }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
.sub-page {
  min-height: 100vh;
  padding: 12px 12px calc(112px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, var(--wc-bg) 0 160px, var(--wc-surface) 160px 100%);
}

.page-header,
.form-card {
  border-radius: var(--wc-radius-xl);
  box-shadow: var(--wc-shadow-card);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(11, 31, 23, 0.94);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--wc-text-on-dark);
  font-size: 28px;
}

.page-header p {
  margin: 0 0 4px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.page-header h1 {
  margin: 0;
  color: var(--wc-text-on-dark);
  font-size: 24px;
}

.form-card {
  margin-top: 16px;
  padding: 22px 18px;
  display: grid;
  gap: 14px;
  background: var(--wc-surface-elevated);
  border: 1px solid var(--wc-border);
}

.field-head strong,
.field-head span {
  display: block;
}

.field-head strong {
  color: var(--wc-text);
  font-size: 18px;
}

.field-head span {
  margin-top: 8px;
  color: var(--wc-text-soft);
  line-height: 1.6;
}

.form-card input {
  height: 52px;
  border: 1px solid var(--wc-border-strong);
  border-radius: 16px;
  padding: 0 16px;
  background: #fff;
  color: var(--wc-text);
  font-size: 15px;
  outline: none;
}

.form-card input:focus {
  border-color: rgba(125, 196, 244, 0.8);
  box-shadow: 0 0 0 4px rgba(125, 196, 244, 0.16);
}

.submit-btn {
  height: 52px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--wc-gold-soft), var(--wc-blue));
  color: var(--wc-bg);
  font-size: 15px;
  font-weight: 800;
}

.message {
  margin: 0;
  color: var(--wc-text-soft);
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }
}
</style>
