<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">关于我们</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="about-content">
      <div class="app-logo">
        <div class="logo-icon">APP</div>
      </div>
      <div class="app-name">开迈农投资</div>
      <div class="app-version">版本 1.0.0</div>

      <div class="about-desc">
        开迈农投资是一款专业的理财投资平台，为用户提供安全、可靠的的投资服务。
      </div>

      <div class="contact-item">
        <Mail :size="18" />
        <span>support@kamainong.com</span>
      </div>
      <div class="contact-item">
        <Phone :size="18" />
        <span>+51 999 888 777</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Mail, Phone } from 'lucide-vue-next'

const router = useRouter()
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.top-nav {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  z-index: 10;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.about-content {
  padding: 40px 24px;
  text-align: center;
}

.app-logo {
  margin-bottom: 16px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
}

.app-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.app-version {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.about-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-top: 32px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: #666;
  font-size: 14px;
}
</style>
