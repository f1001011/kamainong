<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">消息</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="messages-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="messages.length === 0" class="empty">
        暂无消息
      </div>
      <div
        v-else
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        @click="router.push(`/messages/${msg.id}`)"
      >
        <div class="msg-icon" :class="{ unread: !msg.read }">
          <Bell :size="20" />
        </div>
        <div class="msg-content">
          <div class="msg-title">{{ msg.title }}</div>
          <div class="msg-desc">{{ msg.content }}</div>
        </div>
        <div class="msg-time">{{ msg.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Bell } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

const isLoading = ref(true)
const messages = ref<any[]>([])

async function loadMessages() {
  try {
    isLoading.value = true
    const res = await request.get('/notifications')
    messages.value = res.list || []
  } catch (e) {
    console.error('加载消息失败', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMessages()
})
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

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.message-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.msg-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.msg-icon.unread {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.msg-content {
  flex: 1;
}

.msg-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.msg-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-time {
  font-size: 12px;
  color: #ccc;
}
</style>
