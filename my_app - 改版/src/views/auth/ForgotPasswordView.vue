<template>
  <div class="auth-page-card">
    <div class="auth-card-shell">
      <div class="auth-gold-line"></div>
      <button class="back-link" @click="router.push('/login')">العودة إلى تسجيل الدخول</button>
      <div class="support-icon">?</div>
      <div class="auth-copy center">
        <p class="auth-eyebrow">Support Recovery</p>
        <h1>هل نسيت كلمة المرور؟</h1>
        <p>في نسخة Vue الحالية، الاسترجاع يتم عبر قنوات الدعم المباشر مثل Honeywell.</p>
      </div>

      <div class="support-links">
        <a v-for="item in links" :key="item.title" :href="item.url" target="_blank" rel="noreferrer">
          <strong>{{ item.title }}</strong>
          <span>{{ item.desc }}</span>
        </a>
      </div>

      <p class="auth-footer centered">
        إن تذكرت كلمة المرور،
        <button type="button" @click="router.push('/login')">ارجع إلى صفحة الدخول</button>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const links = [
  { title: 'WhatsApp Support', desc: 'تواصل مباشر مع فريق المساعدة', url: 'https://wa.me/' },
  { title: 'Telegram Desk', desc: 'قناة خدمة سريعة للمتابعة', url: 'https://t.me/' },
  { title: 'Email Support', desc: 'ارسل تفاصيل الحساب لاسترجاع الوصول', url: 'mailto:support@example.com' },
]
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

.back-link,
.auth-footer button {
  border: 0;
  background: transparent;
  color: #d0ac73;
  font-weight: 700;
}

.support-icon {
  width: 68px;
  height: 68px;
  margin: 22px auto 14px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(208, 172, 115, 0.24), rgba(208, 172, 115, 0.12));
  color: #d0ac73;
  font-size: 32px;
  font-weight: 800;
}

.auth-copy.center {
  text-align: center;
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

.support-links {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-links a {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
}

.support-links strong {
  color: #fff;
}

.support-links span,
.auth-footer.centered {
  color: rgba(255, 255, 255, 0.58);
}

.auth-footer.centered {
  margin-top: 20px;
  text-align: center;
}
</style>
