<template>
  <div class="detail-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
        </button>
        <h1 class="title">详情</h1>
        <div class="placeholder"></div>
      </div>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="skeleton-detail">
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

    <!-- 错误状态 -->
    <div v-else-if="error || !post" class="error-state">
      <p class="error-text">加载失败</p>
      <button class="retry-btn" @click="refresh">重试</button>
    </div>

    <!-- 帖子详情 -->
    <div v-else class="content">
      <!-- 用户信息 -->
      <div class="user-section">
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

      <!-- 大图展示 -->
      <div class="images-section">
        <div class="image-wrapper" @click="previewImage(post.platformScreenshot)">
          <img :src="post.platformScreenshot" alt="平台截图" />
          <span class="image-label">平台截图</span>
        </div>
        <div class="image-wrapper" @click="previewImage(post.receiptScreenshot)">
          <img :src="post.receiptScreenshot" alt="收据截图" />
          <span class="image-label">收据</span>
        </div>
      </div>

      <!-- 文字内容 -->
      <p v-if="post.content" class="post-content">{{ post.content }}</p>

      <!-- 互动栏 -->
      <div class="actions-section">
        <button class="action-btn" @click="handleLike">
          <span :class="['icon', liked ? 'liked' : '']">
            {{ liked ? '❤️' : '🤍' }}
          </span>
          <span :class="['count', liked ? 'liked' : '']">{{ likeCount }}</span>
        </button>
        <button class="action-btn">
          <span class="icon">💬</span>
          <span class="count">{{ post.commentCount }}</span>
        </button>
      </div>

      <!-- 评论列表 -->
      <div class="comments-section">
        <h3 class="comments-title">评论</h3>
        
        <div v-if="comments.length === 0" class="no-comments">
          <p>暂无评论</p>
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <img v-if="comment.userAvatar" :src="comment.userAvatar" :alt="comment.userName" />
              <span v-else class="avatar-icon">👤</span>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-name">{{ comment.userName }}</span>
                <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部评论输入框 -->
    <div class="comment-input-section">
      <input
        ref="commentInput"
        v-model="commentText"
        type="text"
        placeholder="写评论..."
        class="comment-input"
        @keydown.enter="submitComment"
      />
      <button 
        class="send-btn" 
        :disabled="!commentText.trim() || submitting"
        @click="submitComment"
      >
        <span>发送</span>
      </button>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewUrl" class="preview-overlay" @click="previewUrl = null">
      <img :src="previewUrl" alt="预览" class="preview-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, likePost, postComment, type Comment, type Post } from '@/api/community'

const route = useRoute()
const router = useRouter()

const postId = Number(route.params.id)

// 状态
const loading = ref(true)
const error = ref(false)
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const liked = ref(false)
const likeCount = ref(0)
const commentText = ref('')
const submitting = ref(false)
const previewUrl = ref<string | null>(null)
const commentInput = ref<HTMLInputElement | null>(null)

// 加载帖子详情
const loadDetail = async () => {
  try {
    loading.value = true
    const data = await getPostDetail(postId)
    post.value = data.post
    comments.value = data.comments
    liked.value = data.post.isLiked
    likeCount.value = data.post.likeCount
    error.value = false
  } catch (e) {
    console.error('Failed to load post detail:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 刷新
const refresh = () => loadDetail()

// 点赞
const handleLike = async () => {
  try {
    const result = await likePost(postId)
    liked.value = result.liked
    likeCount.value = result.likeCount
  } catch (e) {
    console.error('Failed to like:', e)
  }
}

// 发表评论
const submitComment = async () => {
  if (!commentText.value.trim() || submitting.value) return
  
  try {
    submitting.value = true
    await postComment(postId, commentText.value.trim())
    commentText.value = ''
    // 刷新评论列表
    await loadDetail()
    // 聚焦输入框
    await nextTick()
    commentInput.value?.focus()
  } catch (e) {
    console.error('Failed to post comment:', e)
  } finally {
    submitting.value = false
  }
}

// 预览图片
const previewImage = (url: string) => {
  previewUrl.value = url
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

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f9ff, #fff, #fafafa);
  padding-bottom: 100px;
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
.skeleton-detail {
  padding: 16px;
}

.skeleton-user {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e5e5;
  animation: pulse 1.5s infinite;
}

.skeleton-user-info {
  flex: 1;
}

.skeleton-name {
  width: 120px;
  height: 18px;
  background: #e5e5e5;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-time {
  width: 80px;
  height: 14px;
  background: #e5e5e5;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-images {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-img {
  aspect-ratio: 16/9;
  border-radius: 16px;
  background: #e5e5e5;
  animation: pulse 1.5s infinite;
}

.skeleton-text {
  width: 75%;
  height: 16px;
  background: #e5e5e5;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-text {
  font-size: 16px;
  color: #666;
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

/* 内容区 */
.content {
  padding: 16px;
}

/* 用户区 */
.user-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
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
  font-size: 16px;
  font-weight: 600;
  color: #2563eb;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.amount-tag {
  padding: 8px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

/* 图片区 */
.images-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.image-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 16/9;
  background: #f5f5f5;
  cursor: pointer;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
}

/* 文字内容 */
.post-content {
  font-size: 16px;
  color: #444;
  line-height: 1.6;
  margin-bottom: 16px;
}

/* 互动栏 */
.actions-section {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.action-btn .icon {
  font-size: 20px;
}

.action-btn .count {
  font-size: 14px;
  font-weight: 500;
}

.action-btn .liked {
  color: #ef4444;
}

/* 评论区 */
.comments-section {
  margin-top: 20px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}

.no-comments {
  text-align: center;
  padding: 32px 0;
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 16px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
}

/* 评论输入框 */
.comment-input-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px) + 68px);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 60;
}

.comment-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border-radius: 22px;
  background: #f5f5f5;
  border: none;
  font-size: 14px;
  color: #333;
}

.comment-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.comment-input::placeholder {
  color: #999;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 图片预览 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 70;
  padding: 16px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
