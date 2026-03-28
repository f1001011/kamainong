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
      <label for="withdraw-input">仅保留字母数字输入</label>
      <input
        id="withdraw-input"
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
  if (!account.value) {
    message.value = '请先输入字母数字账号。'
    return
  }

  message.value = `已提交：${account.value}`
}
</script>

<style scoped>
.sub-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.page-header,
.form-card {
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(8, 44, 28, 0.92);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 28px;
}

.page-header p {
  margin: 0 0 4px;
  color: #9ae6b4;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.page-header h1 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.form-card {
  margin-top: 16px;
  padding: 22px 18px;
  display: grid;
  gap: 14px;
  background: rgba(255, 255, 255, 0.96);
}

.form-card label {
  color: #0d3b23;
  font-weight: 700;
}

.form-card input {
  height: 50px;
  border: 1px solid rgba(13, 59, 35, 0.12);
  border-radius: 16px;
  padding: 0 16px;
  font-size: 15px;
  outline: none;
}

.form-card input:focus {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.14);
}

.submit-btn {
  height: 50px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #f4d66d, #38bdf8);
  color: #062315;
  font-size: 15px;
  font-weight: 800;
}

.message {
  margin: 0;
  color: rgba(13, 59, 35, 0.72);
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 720px;
    padding: 24px 24px 40px;
  }
}
</style>
