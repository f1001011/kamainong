<template>
  <div class="login-root">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="login-wrap">
      <!-- Brand -->
      <div class="brand-area"
        v-motion :initial="{ opacity:0, y:-30 }"
        :enter="{ opacity:1, y:0, transition:{ delay:60, type:'spring', stiffness:200, damping:22 } }">
        <div class="brand-icon"><Zap :size="28" /></div>
        <div class="brand-text">
          <span class="brand-name">{{ t('auth.appName') }}</span>
          <span class="brand-slogan">{{ t('auth.appSlogan') }}</span>
        </div>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card glass-card"
        v-motion :initial="{ opacity:0, y:40, scale:0.94 }"
        :enter="{ opacity:1, y:0, scale:1, transition:{ delay:140, type:'spring', stiffness:180, damping:22 } }">
        <div class="card-top-bar"></div>
        <h2 class="card-title">{{ t('login') }}</h2>
        <p class="card-subtitle">{{ t('auth.appSlogan') }}</p>

        <!-- 手机号 -->
        <div class="field-group" :class="{ 'field-error': phoneErr }">
          <div class="field-icon"><Phone :size="16" /></div>
          <input v-model="phone" class="field-input" type="tel" maxlength="11"
            :placeholder="t('auth.phonePlaceholder')" @input="phoneErr = ''" />
        </div>
        <p v-if="phoneErr" class="err-tip">{{ phoneErr }}</p>

        <!-- 密码 -->
        <div class="field-group" :class="{ 'field-error': passErr }">
          <div class="field-icon"><Lock :size="16" /></div>
          <input v-model="password" class="field-input"
            :type="showPass ? 'text' : 'password'"
            :placeholder="t('auth.passwordPlaceholder')"
            @input="passErr = ''" @keyup.enter="handleLogin" />
          <button class="eye-btn" @click="showPass = !showPass">
            <Eye v-if="!showPass" :size="16" /><EyeOff v-else :size="16" />
          </button>
        </div>
        <p v-if="passErr" class="err-tip">{{ passErr }}</p>

        <div class="forgot-row">
          <button class="forgot-btn">{{ t('auth.forgotPassword') }}</button>
        </div>

        <button class="submit-btn" :class="{ loading }" :disabled="loading" @click="handleLogin">
          <span v-if="!loading">{{ t('auth.loginBtn') }}</span>
          <Loader2 v-else :size="18" class="spinner" />
        </button>
      </div>

      <!-- 注册入口 -->
      <div class="bottom-link"
        v-motion :initial="{ opacity:0 }"
        :enter="{ opacity:1, transition:{ delay:380 } }">
        <span>{{ t('auth.noAccount') }}</span>
        <button class="link-btn" @click="router.push('/register')">{{ t('auth.toRegister') }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Phone, Lock, Eye, EyeOff, Zap, Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/hooks/useAuth'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { t } = useI18n()
const { login } = useAuth()
const { showPopup } = usePopup()

const phone    = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const phoneErr = ref('')
const passErr  = ref('')

function validate() {
  let ok = true
  if (!/^1[3-9]\d{9}$/.test(phone.value)) { phoneErr.value = t('auth.phoneError'); ok = false }
  if (password.value.length < 6)           { passErr.value  = t('auth.passwordError'); ok = false }
  return ok
}

async function handleLogin() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    await login(phone.value, password.value)
    showPopup(t('loginSuccess'), 'loginSuccess')
  } catch {
    showPopup(t('loginFailed'), 'loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  min-height: 100vh; background: var(--bg-base);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; padding: 24px 20px;
  font-family: 'Inter','SF Pro Text',-apple-system,'PingFang SC','Noto Sans SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red   { width:420px; height:420px; top:-120px; left:-80px;   background:var(--orb-red);   animation:drift 16s ease-in-out infinite; }
.orb-cyan  { width:360px; height:360px; bottom:-60px; right:-60px; background:var(--orb-cyan);  animation:drift 20s ease-in-out infinite reverse; }
.orb-amber { width:280px; height:280px; top:55%; left:45%;         background:var(--orb-amber); animation:drift 24s ease-in-out infinite 4s; }
@keyframes drift {
  0%,100% { transform:translate(0,0) scale(1); }
  40%     { transform:translate(20px,-16px) scale(1.05); }
  70%     { transform:translate(-14px,12px) scale(0.96); }
}

.login-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
}

/* ── Brand ── */
.brand-area { display:flex; align-items:center; gap:14px; }
.brand-icon {
  width:52px; height:52px; border-radius:16px;
  background: linear-gradient(135deg,#ff4d4d,#ff1744);
  display:flex; align-items:center; justify-content:center; color:#fff;
  box-shadow: 0 0 24px rgba(255,77,77,0.5), 0 4px 16px rgba(0,0,0,0.3);
}
.brand-text { display:flex; flex-direction:column; gap:2px; }
.brand-name  { font-size:22px; font-weight:800; letter-spacing:-0.5px; color:rgba(255,255,255,0.95); }
.brand-slogan { font-size:11px; letter-spacing:1.2px; color:rgba(255,255,255,0.35); }

/* ── 卡片 ── */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid var(--border); border-radius: 24px;
}
.login-card { width:100%; padding:32px 28px 28px; position:relative; overflow:hidden; }
.card-top-bar {
  position:absolute; top:0; left:0; right:0; height:2px;
  background: linear-gradient(90deg,#ff4d4d,#00e5ff,#ffb800);
  border-radius:24px 24px 0 0;
}
.card-title   { font-size:20px; font-weight:700; color:rgba(255,255,255,0.92); letter-spacing:-0.3px; margin-bottom:4px; }
.card-subtitle { font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:0.3px; margin-bottom:28px; }

/* ── 输入框 ── */
.field-group {
  display:flex; align-items:center;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  border-radius:14px; padding:0 16px; height:52px; margin-bottom:12px;
  transition:border-color 0.2s, background 0.2s;
}
.field-group:focus-within { border-color:rgba(255,77,77,0.5); background:rgba(255,77,77,0.04); }
.field-group.field-error  { border-color:rgba(255,77,77,0.65); }
.field-icon  { color:rgba(255,255,255,0.28); display:flex; align-items:center; margin-right:12px; flex-shrink:0; }
.field-input {
  flex:1; background:none; border:none; outline:none;
  font-size:15px; color:rgba(255,255,255,0.88); font-family:inherit;
}
.field-input::placeholder { color:rgba(255,255,255,0.22); }
.eye-btn {
  background:none; border:none; cursor:pointer;
  color:rgba(255,255,255,0.28); padding:4px; display:flex; align-items:center;
  transition:color 0.2s;
}
.eye-btn:hover { color:rgba(255,255,255,0.6); }
.err-tip { font-size:11px; color:#ff6b6b; margin-top:-8px; margin-bottom:10px; padding-left:4px; }

/* ── 忘记密码 ── */
.forgot-row { display:flex; justify-content:flex-end; margin-bottom:24px; }
.forgot-btn {
  background:none; border:none; cursor:pointer;
  font-size:12px; color:rgba(255,255,255,0.32); font-family:inherit; transition:color 0.2s;
}
.forgot-btn:hover { color:rgba(255,77,77,0.8); }

/* ── 提交按钮 ── */
.submit-btn {
  width:100%; height:52px; border-radius:14px; border:none;
  background: linear-gradient(135deg,#ff4d4d,#ff1744);
  color:#fff; font-size:15px; font-weight:600; letter-spacing:0.5px;
  cursor:pointer; font-family:inherit;
  box-shadow: 0 4px 20px rgba(255,77,77,0.4);
  transition:transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  display:flex; align-items:center; justify-content:center;
}
.submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(255,77,77,0.5); }
.submit-btn:active:not(:disabled) { transform:scale(0.97); }
.submit-btn.loading { opacity:0.7; cursor:not-allowed; }
.spinner { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ── 底部链接 ── */
.bottom-link { display:flex; align-items:center; gap:6px; font-size:13px; color:rgba(255,255,255,0.35); }
.link-btn {
  background:none; border:none; cursor:pointer;
  font-size:13px; font-weight:600; color:#ff4d4d; font-family:inherit; transition:color 0.2s;
}
.link-btn:hover { color:#ff8080; }
</style>
