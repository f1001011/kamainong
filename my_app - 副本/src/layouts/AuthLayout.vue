<template>
  <div class="auth-layout">
    <div class="auth-video-fallback"></div>
    <div class="auth-overlay auth-overlay-bottom"></div>
    <div class="auth-overlay auth-overlay-top"></div>
    <div class="auth-halo auth-halo-center"></div>
    <div class="auth-halo auth-halo-side"></div>
    <div class="auth-brand">
      <div class="auth-brand-mark">L</div>
      <div class="auth-brand-text">
        <span class="auth-brand-name">lendlease</span>
        <span class="auth-brand-sub">smart wealth platform</span>
      </div>
    </div>
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.documentElement.lang = 'ar'
  document.documentElement.dir = 'rtl'
})
</script>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #030303;
}

.auth-video-fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(13, 107, 61, 0.28), transparent 30%),
    radial-gradient(circle at 78% 74%, rgba(201, 169, 110, 0.16), transparent 28%),
    linear-gradient(160deg, #03130c 0%, #061d14 40%, #000 100%);
}

.auth-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.auth-overlay-bottom {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.42) 34%, rgba(0, 0, 0, 0.08) 60%, transparent 100%);
}

.auth-overlay-top {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.14) 0%, transparent 20%);
}

.auth-halo {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(60px);
}

.auth-halo-center {
  left: 50%;
  bottom: -6%;
  width: 580px;
  height: 240px;
  transform: translateX(-50%);
  background: rgba(13, 107, 61, 0.2);
}

.auth-halo-side {
  top: 20%;
  left: -8%;
  width: 220px;
  height: 220px;
  background: rgba(201, 169, 110, 0.16);
}

.auth-brand {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.auth-brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.95), rgba(146, 112, 54, 0.95));
  color: #111;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.28);
}

.auth-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.auth-brand-name {
  color: rgba(255, 255, 255, 0.96);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.auth-brand-sub {
  color: rgba(255, 255, 255, 0.44);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.auth-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 120px 20px 28px;
}

@media (max-width: 640px) {
  .auth-brand {
    top: 22px;
  }

  .auth-content {
    padding-top: 100px;
    padding-bottom: 18px;
  }
}
</style>
