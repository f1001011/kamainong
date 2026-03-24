<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">设置</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="settings-list">
      <div class="setting-item" @click="router.push('/settings/password')">
        <Lock :size="20" />
        <span>修改密码</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item" @click="router.push('/security')">
        <Shield :size="20" />
        <span>安全中心</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item" @click="handleLanguage">
        <Globe :size="20" />
        <span>语言</span>
        <span class="setting-value">中文</span>
      </div>
      <div class="setting-item" @click="router.push('/about')">
        <Info :size="20" />
        <span>关于我们</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item">
        <FileText :size="20" />
        <span>用户协议</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item">
        <Shield :size="20" />
        <span>隐私政策</span>
        <ArrowRight :size="16" />
      </div>
    </div>

    <div class="version">版本 1.0.0</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Lock, Shield, Globe, Info, FileText } from 'lucide-vue-next'

const router = useRouter()

function handleLanguage() {
  // TODO: 语言切换
}
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

.settings-list {
  background: white;
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.setting-item svg:last-child {
  color: #ccc;
}

.setting-value {
  color: #999 !important;
}

.version {
  text-align: center;
  padding: 24px;
  color: #ccc;
  font-size: 12px;
}
</style>
