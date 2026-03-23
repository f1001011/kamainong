<template>
  <div class="settings-page">
    <div class="header">
      <h1>{{ t('nav.settings') }}</h1>
    </div>

    <div class="user-info">
      <div class="info-item">
        <span class="label">{{ t('settings.username') }}</span>
        <span class="value">{{ userInfo.username }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ t('settings.phone') }}</span>
        <span class="value">{{ userInfo.phone }}</span>
      </div>
    </div>

    <div class="password-section">
      <h3>{{ t('settings.changePassword') }}</h3>
      <input v-model="oldPassword" type="password" :placeholder="t('settings.oldPassword')" />
      <input v-model="newPassword" type="password" :placeholder="t('settings.newPassword')" />
      <input v-model="confirmPassword" type="password" :placeholder="t('settings.confirmPassword')" />
      <button @click="handleChangePassword">{{ t('settings.submit') }}</button>
    </div>

    <button class="logout-btn" @click="handleLogout">{{ t('settings.logout') }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getUserInfo, changePassword } from '@/api/user'

const router = useRouter()
const { t } = useI18n()

const userInfo = ref({ username: '', phone: '' })
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const handleChangePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    alert(t('settings.passwordMismatch'))
    return
  }
  await changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(async () => {
  userInfo.value = await getUserInfo()
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  padding: 20px 20px 80px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
}

.user-info {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.info-item .value {
  font-size: 14px;
  color: #fff;
}

.password-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
}

.password-section h3 {
  font-size: 16px;
  color: #fff;
  margin-bottom: 16px;
}

.password-section input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  margin-bottom: 10px;
}

.password-section button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.logout-btn {
  width: 100%;
  padding: 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
  font-weight: 600;
  cursor: pointer;
}
</style>
