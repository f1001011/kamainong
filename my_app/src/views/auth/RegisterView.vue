<template>
  <div class="auth-page-card">
    <div class="auth-card-shell">
      <div class="auth-gold-line"></div>
      <div class="auth-copy">
        <p class="auth-eyebrow">Create Account</p>
        <h1>إنشاء حساب</h1>
        <p>نسخة Vue من بطاقة التسجيل الداكنة، مع دعم رمز الدعوة وسلوك الواجهة العربية.</p>
      </div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <label>
          <span>رقم الهاتف</span>
          <input v-model="phone" type="tel" maxlength="11" placeholder="13000000000" />
          <small v-if="phoneErr">{{ phoneErr }}</small>
        </label>

        <label>
          <span>رمز التحقق</span>
          <div class="captcha-row">
            <input v-model="code" type="text" maxlength="4" placeholder="ABCD" />
            <canvas ref="captchaCanvas" class="captcha-box" @click="loadCaptcha"></canvas>
          </div>
          <small v-if="codeErr">{{ codeErr }}</small>
        </label>

        <label>
          <span>كلمة المرور</span>
          <div class="password-wrap">
            <input v-model="password" :type="showPass ? 'text' : 'password'" placeholder="******" />
            <button type="button" @click="showPass = !showPass">{{ showPass ? 'Hide' : 'Show' }}</button>
          </div>
          <small v-if="passErr">{{ passErr }}</small>
        </label>

        <label>
          <span>رمز الدعوة</span>
          <input v-model="inviteCode" type="text" placeholder="REF123" :readonly="inviteLocked" />
        </label>

        <button class="submit-btn" :disabled="loading">
          <span v-if="!loading">إنشاء الحساب</span>
          <span v-else>Loading...</span>
        </button>
      </form>

      <p class="auth-footer">
        لديك حساب بالفعل؟
        <button type="button" @click="router.push('/login')">تسجيل الدخول</button>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCaptcha } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'
import { usePopup } from '@/composables/usePopup'

const route = useRoute()
const router = useRouter()
const { register } = useAuth()
const { showPopup } = usePopup()

const phone = ref('')
const code = ref('')
const password = ref('')
const inviteCode = ref(String(route.query.ref || ''))
const inviteLocked = ref(Boolean(route.query.ref))
const showPass = ref(false)
const loading = ref(false)
const phoneErr = ref('')
const codeErr = ref('')
const passErr = ref('')
const captchaValue = ref('')
const captchaCanvas = ref<HTMLCanvasElement | null>(null)

function drawCaptcha(text: string) {
  const canvas = captchaCanvas.value
  if (!canvas) return
  canvas.width = 128
  canvas.height = 52
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 128, 52)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, 0, 128, 52)
  ctx.font = 'bold 24px monospace'
  ctx.fillStyle = '#d0ac73'
  ctx.fillText(text, 26, 33)
}

async function loadCaptcha() {
  const res = await fetchCaptcha()
  captchaValue.value = res.code
  await nextTick()
  drawCaptcha(res.code)
}

function validate() {
  let ok = true
  phoneErr.value = ''
  codeErr.value = ''
  passErr.value = ''
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    phoneErr.value = '请输入正确手机号'
    ok = false
  }
  if (code.value.trim().toUpperCase() !== captchaValue.value.toUpperCase()) {
    codeErr.value = '验证码不正确'
    ok = false
  }
  if (password.value.length < 6) {
    passErr.value = '密码至少 6 位'
    ok = false
  }
  return ok
}

async function handleRegister() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    await register(phone.value, code.value, password.value)
    showPopup('注册成功', 'success')
  } catch {
    showPopup('注册失败', 'error')
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCaptcha()
})
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
  color: #fff;
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

.auth-form span,
.auth-footer {
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

.captcha-row,
.password-wrap {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.captcha-box {
  width: 128px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.password-wrap button,
.auth-footer button {
  background: transparent;
  border: 0;
  color: #d0ac73;
  font-weight: 700;
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
  font-size: 14px;
}
</style>
