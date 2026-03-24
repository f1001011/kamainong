<template>
  <div class="community-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
        </button>
        <h1 class="title">社区</h1>
        <button class="my-posts-btn" @click="goToMyPosts">
          <span class="icon">👤</span>
        </button>
      </div>
    </header>

    <!-- 页面内容 -->
    <div class="content">
      <!-- 标题区 -->
      <div class="page-header">
        <h2 class="page-title">广场</h2>
        <p class="page-subtitle">分享你的成功</p>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="skeleton-user">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-user-info">
              <div class="skeleton-name"></div>
              <div class="skeleton-time"></div>
            </div>
          </div>
          <div class="skeleton-images">
            <div class="skeleton-img"></div>
            <div class="skeleton-img"></div>
          </div>
          <div class="skeleton-text"></div>
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
        <p class="empty-desc">成为第一个分享成功的人</p>
      </div>

      <!-- 帖子列表 -->
      <div v-else class="post-list">
        <div
          v-for="(post, index) in posts"
          :key="post.id"
          class="post-card"
          @click="goToDetail(post.id)"
        >
          <!-- 用户信息 -->
          <div class="post-header">
            <div class="user-info">
              <div class="avatar">
                <img v-if="post.userAvatar" :src="post.userAvatar" :alt="post.userName" />
                <span v-else class="avatar-text">{{ post.userName?.charAt(0)?.toUpperCase() }}</span>
              </div>
              <div class="user-detail">
                <p class="user-name">{{ post.userName }}</p>
                <p class="post-time">{{ formatRelativeTime(post.createdAt) }}</p>
              </div>
            </div>
            <div class="amount-tag">
              {{ formatCurrency(post.withdrawAmount) }}
            </div>
          </div>

          <!-- 双图预览 -->
          <div class="post-images">
            <div class="image-wrapper">
              <img :src="post.platformScreenshot" alt="平台截图" loading="lazy" />
              <span class="image-label">平台</span>
            </div>
            <div class="image-wrapper">
              <img :src="post.receiptScreenshot" alt="收据截图" loading="lazy" />
              <span class="image-label">收据</span>
            </div>
          </div>

          <!-- 文字内容 -->
          <p v-if="post.content" class="post-content">{{ post.content }}</p>

          <!-- 互动栏 -->
          <div class="post-actions">
            <button class="action-btn" @click.stop="handleLike(post)">
              <span :class="['icon', post.isLiked ? 'liked' : '']">
                {{ post.isLiked ? '❤️' : '🤍' }}
              </span>
              <span :class="['count', post.isLiked ? 'liked' : '']">{{ post.likeCount }}</span>
            </button>
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
    <button class="create-btn" @click="goToCreate">
      <span class="icon">+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts, likePost, type Post } from '@/api/community'

const router = useRouter()

// 状态
const loading = ref(true)
const error = ref(false)
const loadingMore = ref(false)
const posts = ref<Post[]>([])
const page = ref(1)
const pageSize = 10
const total = ref(0)

const hasMore = computed(() => posts.value.length < total.value)

// 加载帖子列表
const loadPosts = async (reset = false) => {
  try {
    if (reset) {
      page.value = 1
      posts.value = []
    }
    const currentPage = reset ? 1 : page.value
    const data = await getPosts(currentPage, pageSize)
    if (reset) {
      posts.value = data.list
    } else {
      posts.value = [...posts.value, ...data.list]
    }
    total.value = data.pagination.total
    page.value++
    error.value = false
  } catch (e) {
    console.error('Failed to load posts:', e)
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

// 点赞
const handleLike = async (post: Post) => {
  try {
    const result = await likePost(post.id)
    post.isLiked = result.liked
    post.likeCount = result.likeCount
  } catch (e) {
    console.error('Failed to like:', e)
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
const goToMyPosts = () => router.push('/community/my')
const goToCreate = () => router.push('/community/create')

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.community-page {
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

.back-btn,
.my-posts-btn {
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

.back-btn:hover,
.my-posts-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.back-btn .icon,
.my-posts-btn .icon {
  font-size: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.content {
  padding: 16px;
  padding-bottom: 120px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* 骨架屏 */
.skeleton-list {
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

.skeleton-user {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e5e5;
  animation: pulse 1.5s infinite;
}

.skeleton-user-info {
  flex: 1;
}

.skeleton-name {
  width: 100px;
  height: 16px;
  background: #e5e5e5;
  border-radius: 4px;
  margin-bottom: 6px;
  animation: pulse 1.5s infinite;
}

.skeleton-time {
  width: 60px;
  height: 12px;
  background: #e5e5e5;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
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

.skeleton-text {
  width: 75%;
  height: 14px;
  background: #e5e5e5;
  border-radius: 4px;
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

.retry-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 帖子卡片 */
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

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.post-time {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount-tag {
  padding: 6px 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
}

.post-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
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

.image-label {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
}

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
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.action-btn .icon {
  font-size: 18px;
}

.action-btn .count {
  font-size: 14px;
}

.action-btn .liked {
  color: #ef4444;
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
.create-btn {
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

.create-btn .icon {
  font-size: 28px;
}

.create-btn:hover {
  transform: scale(1.1);
}
</style>
