<template>
  <div class="my-posts-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
        </button>
        <h1 class="title">我的帖子</h1>
        <div class="placeholder"></div>
      </div>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-card">
        <div class="skeleton-images">
          <div class="skeleton-img"></div>
          <div class="skeleton-img"></div>
        </div>
        <div class="skeleton-status"></div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-text">加载失败</p>
      <button class="retry-btn" @click="refresh">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="posts.length === 0" class="empty-state">
      <p class="empty-text">暂无帖子</p>
      <p class="empty-desc">发布你的第一条帖子吧</p>
      <button class="create-btn" @click="goToCreate">去发布</button>
    </div>

    <!-- 帖子列表 -->
    <div v-else class="content">
      <div class="post-list">
        <div
          v-for="(post, index) in posts"
          :key="post.id"
          class="post-card"
          @click="goToDetail(post.id)"
        >
          <!-- 状态标签 -->
          <div :class="['status-tag', post.status.toLowerCase()]">
            <span class="status-icon">{{ getStatusIcon(post.status) }}</span>
            <span class="status-text">{{ getStatusText(post.status) }}</span>
          </div>

          <!-- 拒绝原因 -->
          <div v-if="post.status === 'REJECTED' && post.rejectReason" class="reject-reason">
            拒绝原因：{{ post.rejectReason }}
          </div>

          <!-- 双图预览 -->
          <div class="post-images">
            <div class="image-wrapper">
              <img :src="post.platformScreenshot" alt="平台截图" loading="lazy" />
            </div>
            <div class="image-wrapper">
              <img :src="post.receiptScreenshot" alt="收据截图" loading="lazy" />
            </div>
          </div>

          <!-- 金额和时间 -->
          <div class="post-info">
            <span class="amount">{{ formatCurrency(post.withdrawAmount) }}</span>
            <span class="time">{{ formatRelativeTime(post.createdAt) }}</span>
          </div>

          <!-- 文字内容 -->
          <p v-if="post.content" class="post-content">{{ post.content }}</p>

          <!-- 互动栏 -->
          <div class="post-actions">
            <div class="action-btn">
              <span class="icon">❤️</span>
              <span class="count">{{ post.likeCount }}</span>
            </div>
            <div class="action-btn">
              <span class="icon">💬</span>
              <span class="count">{{ post.commentCount }}</span>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <span v-if="loadingMore">加载中...</span>
          <button v-else @click="loadMore">加载更多</button>
        </div>
      </div>
    </div>

    <!-- 浮动创建按钮 -->
    <button class="create-float-btn" @click="goToCreate">
      <span class="icon">+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyPosts, type MyPost } from '@/api/community'

const router = useRouter()

// 状态
const loading = ref(true)
const error = ref(false)
const loadingMore = ref(false)
const posts = ref<MyPost[]>([])
const page = ref(1)
const pageSize = 10
const total = ref(0)

const hasMore = computed(() => posts.value.length < total.value)

// 加载我的帖子
const loadPosts = async (reset = false) => {
  try {
    if (reset) {
      page.value = 1
      posts.value = []
    }
    const currentPage = reset ? 1 : page.value
    const data = await getMyPosts(currentPage, pageSize)
    if (reset) {
      posts.value = data.list
    } else {
      posts.value = [...posts.value, ...data.list]
    }
    total.value = data.pagination.total
    page.value++
    error.value = false
  } catch (e) {
    console.error('Failed to load my posts:', e)
    error.value = true
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  loadingMore.value = true
  loadPosts()
}

// 刷新
const refresh = () => {
  loading.value = true
  loadPosts(true)
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING': return '⏳'
    case 'APPROVED': return '✅'
    case 'REJECTED': return '❌'
    default: return '❓'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return '待审核'
    case 'APPROVED': return '已通过'
    case 'REJECTED': return '已拒绝'
    default: return '未知'
  }
}

// 格式化相对时间
const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// 格式化金额
const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`
}

// 导航
const goBack = () => router.back()
const goToDetail = (id: number) => router.push(`/community/${id}`)
const goToCreate = () => router.push('/community/create')

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.my-posts-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f9ff, #fff, #fafafa);
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(250, 250, 248, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.back-btn .icon {
  font-size: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.placeholder {
  width: 40px;
}

/* 骨架屏 */
.skeleton-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.skeleton-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.skeleton-img {
  aspect-ratio: 4/3;
  border-radius: 12px;
  background: #e5e5e5;
  animation: pulse 1.5s infinite;
}

.skeleton-status {
  width: 80px;
  height: 24px;
  background: #e5e5e5;
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 错误/空状态 */
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.error-text,
.empty-text {
  font-size: 16px;
  color: #666;
}

.empty-desc {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.retry-btn,
.create-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 帖子列表 */
.content {
  padding: 16px;
  padding-bottom: 100px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.2s;
}

.post-card:active {
  transform: scale(0.99);
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.status-tag.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-tag.approved {
  background: #d1fae5;
  color: #059669;
}

.status-tag.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status-icon {
  font-size: 12px;
}

/* 拒绝原因 */
.reject-reason {
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 8px;
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 12px;
}

/* 图片 */
.post-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.image-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: #f5f5f5;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 金额和时间 */
.post-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.amount {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
}

.time {
  font-size: 12px;
  color: #999;
}

/* 文字内容 */
.post-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 互动栏 */
.post-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
}

.action-btn .icon {
  font-size: 16px;
}

.action-btn .count {
  font-size: 14px;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 20px;
}

.load-more button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
}

/* 浮动创建按钮 */
.create-float-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  border: none;
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.create-float-btn .icon {
  font-size: 28px;
}
</style>
