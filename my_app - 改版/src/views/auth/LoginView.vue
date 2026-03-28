<template>
  <div class="auth-page-card">
    <div class="auth-card-shell">
      <div class="auth-gold-line"></div>
      <div class="auth-copy">
        <p class="auth-eyebrow">Account Access</p>
        <h1>تسجيل الدخول</h1>
        <p>واجهة Vue مستوحاة من بطاقة Honeywell الداكنة مع نفس الإيقاع البصري والزجاج الداكن.</p>
      </div>

      <form class="auth-form" @submit.prevent="handleLogin">
        <label>
          <span>رقم الهاتف</span>
          <input v-model="phone" type="tel" maxlength="11" placeholder="13000000000" />
          <small v-if="phoneErr">{{ phoneErr }}</small>
        </label>

        <label>
          <span>كلمة المرور</span>
          <div class="password-wrap">
            <input v-model="password" :type="showPass ? 'text' : 'password'" placeholder="******" />
            <button type="button" @click="showPass = !showPass">{{ showPass ? 'Hide' : 'Show' }}</button>
          </div>
          <small v-if="passErr">{{ passErr }}</small>
        </label>

        <button class="text-link" type="button" @click="router.push('/forgot-password')">نسيت كلمة المرور؟</button>

        <button class="submit-btn" :disabled="loading">
          <span v-if="!loading">دخول</span>
          <span v-else>Loading...</span>
        </button>
      </form>

      <p class="auth-footer">
        ليس لديك حساب؟
        <button type="button" @click="router.push('/register')">إنشاء حساب</button>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/hooks/useAuth'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { login } = useAuth()
const { showPopup } = usePopup()

const phone = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const phoneErr = ref('')
const passErr = ref('')

function validate() {
  let ok = true
  phoneErr.value = ''
  passErr.value = ''
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    phoneErr.value = '请输入正确手机号'
    ok = false
  }
  if (password.value.length < 6) {
    passErr.value = '密码至少 6 位'
    ok = false
  }
  return ok
}

async function handleLogin() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    await login(phone.value, password.value)
    showPopup('登录成功', 'success')
  } catch {
    showPopup('登录失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page-card {
  width: 100%;
  max-width: 420px;
}

.auth-card-shell {
  position: relative;
  overflow: hidden;
  padding: 28px;
  border-radius: 28px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(36px) saturate(1.2);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.3);
}

.auth-gold-line {
  position: absolute;
  top: 0;
  left: 32px;
  right: 32px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.45), transparent);
}

.auth-copy h1,
.auth-copy p,
.auth-copy span,
.auth-copy .auth-eyebrow,
.auth-footer,
.auth-footer button,
.text-link,
.auth-form span {
  color: #fff;
}

.auth-eyebrow {
  margin: 0 0 10px;
  color: rgba(212, 175, 55, 0.82);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 11px;
}

.auth-copy h1 {
  margin: 0;
  font-size: 32px;
}

.auth-copy p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.8;
}

.auth-form {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-form span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.auth-form input {
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  padding: 0 16px;
  outline: 0;
}

.password-wrap {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.password-wrap button,
.text-link,
.auth-footer button {
  background: transparent;
  border: 0;
  color: #d0ac73;
  font-weight: 700;
}

.text-link {
  align-self: flex-start;
}

.submit-btn {
  margin-top: 4px;
  height: 54px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #0d6b3d, #15834b);
  color: #fff;
  font-weight: 700;
}

.auth-form small {
  color: #ff8f8f;
}

.auth-footer {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.52);
  font-size: 14px;
}
</style>
