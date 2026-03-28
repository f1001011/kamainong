<template>
  <div class="reg-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
      <div class="orb orb-lime"></div>
      <div class="orb orb-red"></div>
    </div>

    <div class="reg-wrap">
      <!-- 顶部返回 -->
      <div class="top-bar"
        v-motion :initial="{ opacity:0, y:-20 }"
        :enter="{ opacity:1, y:0, transition:{ delay:40 } }">
        <button class="back-btn" @click="router.push('/login')">
          <ChevronLeft :size="20" />
        </button>
        <span class="top-title">{{ t('auth.registerTitle') }}</span>
        <div style="width:38px"></div>
      </div>

      <!-- Hero -->
      <div class="reg-hero"
        v-motion :initial="{ opacity:0, x:-24 }"
        :enter="{ opacity:1, x:0, transition:{ delay:100, type:'spring', stiffness:200, damping:22 } }">
        <div class="hero-icon"><UserPlus :size="26" /></div>
        <div>
          <div class="hero-title">{{ t('auth.registerTitle') }}</div>
          <div class="hero-sub">{{ t('auth.registerSubtitle') }}</div>
        </div>
      </div>

      <!-- 注册卡片 -->
      <div class="reg-card glass-card"
        v-motion :initial="{ opacity:0, y:40, scale:0.94 }"
        :enter="{ opacity:1, y:0, scale:1, transition:{ delay:160, type:'spring', stiffness:180, damping:22 } }">
        <div class="card-top-bar"></div>

        <!-- 手机号 -->
        <div class="field-label">{{ t('auth.phone') }}</div>
        <div class="field-group" :class="{ 'field-error': phoneErr }">
          <div class="field-icon"><Phone :size="16" /></div>
          <input v-model="phone" class="field-input" type="tel" maxlength="11"
            :placeholder="t('auth.phonePlaceholder')" @input="phoneErr = ''" />
        </div>
        <p v-if="phoneErr" class="err-tip">{{ phoneErr }}</p>

        <!-- 图形验证码 -->
        <div class="field-label">{{ t('auth.smsCode') }}</div>
        <div class="captcha-row">
          <div class="field-group captcha-input-wrap" :class="{ 'field-error': codeErr }">
            <div class="field-icon"><KeyRound :size="16" /></div>
            <input v-model="code" class="field-input" type="text" maxlength="4"
              :placeholder="t('auth.smsPlaceholder')" @input="codeErr = ''" />
          </div>
          <div class="captcha-img-wrap" @click="loadCaptcha" title="点击刷新">
            <canvas ref="captchaCanvas" class="captcha-canvas"></canvas>
            <div class="captcha-refresh-hint"><RefreshCw :size="11" />刷新</div>
          </div>
        </div>
        <p v-if="codeErr" class="err-tip">{{ codeErr }}</p>

        <!-- 密码 -->
        <div class="field-label">{{ t('password') }}</div>
        <div class="field-group" :class="{ 'field-error': passErr }">
          <div class="field-icon"><Lock :size="16" /></div>
          <input v-model="password" class="field-input"
            :type="showPass ? 'text' : 'password'"
            :placeholder="t('auth.newPasswordPlaceholder')"
            @input="passErr = ''" @keyup.enter="handleRegister" />
          <button class="eye-btn" @click="showPass = !showPass">
            <Eye v-if="!showPass" :size="16" /><EyeOff v-else :size="16" />
          </button>
        </div>
        <p v-if="passErr" class="err-tip">{{ passErr }}</p>

        <!-- 注册按钮 -->
        <button class="submit-btn" :class="{ loading }" :disabled="loading" @click="handleRegister">
          <span v-if="!loading">{{ t('auth.registerBtn') }}</span>
          <Loader2 v-else :size="18" class="spinner" />
        </button>

        <p class="agreement">注册即代表同意 <span class="agreement-link">用户协议</span> 和 <span class="agreement-link">隐私政策</span></p>
      </div>

      <!-- 登录入口 -->
      <div class="bottom-link"
        v-motion :initial="{ opacity:0 }"
        :enter="{ opacity:1, transition:{ delay:400 } }">
        <span>{{ t('auth.hasAccount') }}</span>
        <button class="link-btn" @click="router.push('/login')">{{ t('auth.toLogin') }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Phone, Lock, Eye, EyeOff, ChevronLeft, UserPlus, Loader2, KeyRound, RefreshCw } from 'lucide-vue-next'
import { useAuth } from '@/hooks/useAuth'
import { usePopup } from '@/composables/usePopup'
import { fetchCaptcha } from '@/api/auth'

const router = useRouter()
const { t } = useI18n()
const { register } = useAuth()
const { showPopup } = usePopup()

const phone    = ref('')
const code     = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const phoneErr = ref('')
const codeErr  = ref('')
const passErr  = ref('')

// ── 验证码 canvas ──────────────────────────────────────────────────────────
const captchaCanvas = ref<HTMLCanvasElement | null>(null)
const captchaId     = ref('')
const captchaCode   = ref('')   // 仅 mock 阶段使用，真实接口不会暴露
const canvasW = 120
const canvasH = 52

const CHAR_COLORS = ['#ff4d4d', '#00e5ff', '#ffb800', '#69ff47', '#ff8080', '#80f0ff', '#ffd060']

function drawCaptcha(canvas: HTMLCanvasElement, code: string) {
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth  || canvasW
  const H = canvas.offsetHeight || canvasH

  // 按 DPR 设置绘制缓冲区，避免高分屏模糊/裁剪
  canvas.width  = W * dpr
  canvas.height = H * dpr

  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, W, H)

  // 背景
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, 0, W, H)

  // 干扰曲线（贝塞尔）
  const lineColors = [
    'rgba(255,77,77,0.35)',
    'rgba(0,229,255,0.35)',
    'rgba(255,184,0,0.30)',
  ]
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = lineColors[i]
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(0, Math.random() * H)
    ctx.bezierCurveTo(
      W * 0.3, Math.random() * H,
      W * 0.7, Math.random() * H,
      W,       Math.random() * H,
    )
    ctx.stroke()
  }

  // 字符
  const chars = code.split('')
  const slotW = W / (chars.length + 0.6)
  chars.forEach((char, i) => {
    ctx.save()
    const size = 20 + Math.floor(Math.random() * 6)
    ctx.font = `bold ${size}px 'Courier New', monospace`
    ctx.fillStyle = CHAR_COLORS[i % CHAR_COLORS.length]
    ctx.shadowColor = CHAR_COLORS[i % CHAR_COLORS.length]
    ctx.shadowBlur = 6
    const x = slotW * (i + 0.7) + (Math.random() - 0.5) * 5
    const y = H / 2 + size * 0.36 + (Math.random() - 0.5) * 4
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.45)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  })

  // 噪点
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.22})`
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.3 + 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

async function loadCaptcha() {
  const res = await fetchCaptcha()
  captchaId.value   = res.captchaId
  captchaCode.value = res.code
  await nextTick()
  if (captchaCanvas.value) drawCaptcha(captchaCanvas.value, res.code)
}

onMounted(() => loadCaptcha())

// ── 表单校验 & 提交 ────────────────────────────────────────────────────────
function validate() {
  let ok = true
  if (!/^1[3-9]\d{9}$/.test(phone.value))                    { phoneErr.value = t('auth.phoneError');    ok = false }
  if (code.value.trim().length < 4)                           { codeErr.value  = t('auth.codeError');     ok = false }
  if (password.value.length < 6)                              { passErr.value  = t('auth.passwordError'); ok = false }
  return ok
}

async function handleRegister() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    await register(phone.value, code.value, password.value)
    showPopup(t('auth.registerSuccess'), 'success')
  } catch {
    showPopup(t('auth.registerFailed'), 'loginFailed')
    loadCaptcha()   // 失败后刷新验证码
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.reg-root {
  min-height: 100vh; background: var(--bg-base);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; padding: 24px 20px;
  font-family: 'Inter','SF Pro Text',-apple-system,'PingFang SC','Noto Sans SC',sans-serif;
  -webkit-font-smoothing: antialiased;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-cyan { width:400px; height:400px; top:-80px; right:-80px;   background:var(--orb-cyan);          animation:drift 18s ease-in-out infinite; }
.orb-lime { width:320px; height:320px; bottom:-60px; left:-40px; background:rgba(105,255,71,0.22);     animation:drift 22s ease-in-out infinite reverse; }
.orb-red  { width:260px; height:260px; top:50%; left:50%;        background:var(--orb-red);            animation:drift 26s ease-in-out infinite 3s; }
@keyframes drift {
  0%,100% { transform:translate(0,0) scale(1); }
  40%     { transform:translate(18px,-14px) scale(1.05); }
  70%     { transform:translate(-12px,10px) scale(0.96); }
}

.reg-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; gap: 20px;
}

/* ── 顶部栏 ── */
.top-bar { display:flex; align-items:center; justify-content:space-between; }
.back-btn {
  width:38px; height:38px; border-radius:11px;
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
  color:rgba(255,255,255,0.6); display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:background 0.2s, transform 0.15s;
}
.back-btn:hover  { background:rgba(255,255,255,0.1); }
.back-btn:active { transform:scale(0.93); }
.top-title { font-size:15px; font-weight:600; color:rgba(255,255,255,0.7); letter-spacing:0.3px; }

/* ── Hero ── */
.reg-hero { display:flex; align-items:center; gap:14px; padding:0 2px; }
.hero-icon {
  width:50px; height:50px; border-radius:15px; flex-shrink:0;
  background:linear-gradient(135deg,#00e5ff,#00b0ff);
  display:flex; align-items:center; justify-content:center; color:#fff;
  box-shadow:0 0 22px rgba(0,229,255,0.45), 0 4px 14px rgba(0,0,0,0.3);
}
.hero-title { font-size:20px; font-weight:800; color:rgba(255,255,255,0.92); letter-spacing:-0.3px; margin-bottom:3px; }
.hero-sub   { font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:0.2px; }

/* ── 卡片 ── */
.glass-card {
  background:var(--bg-card);
  backdrop-filter:blur(28px) saturate(160%);
  -webkit-backdrop-filter:blur(28px) saturate(160%);
  border:1px solid var(--border); border-radius:24px;
}
.reg-card { width:100%; padding:28px 28px 24px; position:relative; overflow:hidden; }
.card-top-bar {
  position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,#00e5ff,#69ff47,#ffb800);
  border-radius:24px 24px 0 0;
}

/* ── 字段标签 ── */
.field-label {
  font-size:11px; font-weight:500; letter-spacing:0.8px; text-transform:uppercase;
  color:rgba(255,255,255,0.35); margin-bottom:8px; margin-top:16px;
}
.field-label:first-of-type { margin-top:0; }

/* ── 输入框 ── */
.field-group {
  display:flex; align-items:center;
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  border-radius:14px; padding:0 16px; height:52px; margin-bottom:6px;
  transition:border-color 0.2s, background 0.2s;
}
.field-group:focus-within { border-color:rgba(0,229,255,0.5); background:rgba(0,229,255,0.04); }
.field-group.field-error  { border-color:rgba(255,77,77,0.65); }
.field-icon { color:rgba(255,255,255,0.28); display:flex; align-items:center; margin-right:12px; flex-shrink:0; }
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
.err-tip { font-size:11px; color:#ff6b6b; margin-bottom:4px; padding-left:4px; }

/* ── 图形验证码区域 ── */
.captcha-row {
  display:flex; gap:10px; align-items:stretch; margin-bottom:6px;
}
.captcha-input-wrap {
  flex:1; margin-bottom:0;
}
.captcha-img-wrap {
  flex-shrink:0; position:relative;
  width:120px; height:52px; border-radius:14px; overflow:hidden;
  border:1px solid rgba(255,255,255,0.1);
  cursor:pointer;
  transition:border-color 0.2s, transform 0.15s;
}
.captcha-img-wrap:hover {
  border-color:rgba(0,229,255,0.4);
  transform:scale(0.98);
}
.captcha-img-wrap:hover .captcha-refresh-hint { opacity:1; }
.captcha-canvas {
  display:block; width:100%; height:100%;
}
.captcha-refresh-hint {
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center; gap:4px;
  font-size:11px; font-weight:500; color:rgba(255,255,255,0.9);
  background:rgba(8,12,24,0.65);
  backdrop-filter:blur(4px);
  opacity:0; transition:opacity 0.2s;
  letter-spacing:0.3px;
}

/* ── 提交按钮 ── */
.submit-btn {
  width:100%; height:52px; border-radius:14px; border:none; margin-top:20px;
  background:linear-gradient(135deg,#00e5ff,#00b0ff);
  color:#fff; font-size:15px; font-weight:600; letter-spacing:0.5px;
  cursor:pointer; font-family:inherit;
  box-shadow:0 4px 20px rgba(0,229,255,0.35);
  transition:transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  display:flex; align-items:center; justify-content:center;
}
.submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,229,255,0.45); }
.submit-btn:active:not(:disabled) { transform:scale(0.97); }
.submit-btn.loading { opacity:0.7; cursor:not-allowed; }
.spinner { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ── 协议 ── */
.agreement {
  text-align:center; margin-top:14px;
  font-size:11px; color:rgba(255,255,255,0.22); letter-spacing:0.2px;
}
.agreement-link { color:rgba(0,229,255,0.6); cursor:pointer; }
.agreement-link:hover { color:#00e5ff; }

/* ── 底部链接 ── */
.bottom-link { display:flex; align-items:center; justify-content:center; gap:6px; font-size:13px; color:rgba(255,255,255,0.35); }
.link-btn {
  background:none; border:none; cursor:pointer;
  font-size:13px; font-weight:600; color:#00e5ff; font-family:inherit; transition:color 0.2s;
}
.link-btn:hover { color:#80f0ff; }
</style>
