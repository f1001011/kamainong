<template>
  <div class="create-page">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <span class="icon">←</span>
        </button>
        <h1 class="title">发布帖子</h1>
        <div class="placeholder"></div>
      </div>
    </header>

    <!-- 内容区 -->
    <div class="content">
      <!-- 选择订单 -->
      <div class="form-section">
        <label class="form-label">选择提现订单</label>
        <div 
          class="order-picker" 
          :class="{ active: showOrderPicker }"
          @click="toggleOrderPicker"
        >
          <span v-if="selectedOrder" class="selected-order">
            {{ selectedOrder.orderNo }} - {{ formatCurrency(selectedOrder.amount) }}
          </span>
          <span v-else class="placeholder-text">请选择已完成的提现订单</span>
          <span class="arrow">▼</span>
        </div>

        <!-- 订单下拉列表 -->
        <div v-if="showOrderPicker" class="order-list">
          <div v-if="ordersLoading" class="loading-text">加载中...</div>
          <div v-else-if="completedOrders.length === 0" class="empty-text">暂无已完成的订单</div>
          <div
            v-else
            v-for="order in completedOrders"
            :key="order.id"
            class="order-item"
            @click="selectOrder(order)"
          >
            <span class="order-no">{{ order.orderNo }}</span>
            <span class="order-amount">{{ formatCurrency(order.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- 平台截图 -->
      <div class="form-section">
        <label class="form-label">平台截图</label>
        <div class="image-upload" @click="triggerPlatformUpload">
          <img v-if="platformPreview" :src="platformPreview" alt="平台截图" class="preview-img" />
          <div v-else class="upload-placeholder">
            <span class="upload-icon">📷</span>
            <span class="upload-text">点击上传</span>
          </div>
          <input
            ref="platformInput"
            type="file"
            accept="image/*"
            class="file-input"
            @change="handlePlatformChange"
          />
        </div>
        <button v-if="platformPreview" class="clear-btn" @click="clearPlatform">
          清除
        </button>
      </div>

      <!-- 收据截图 -->
      <div class="form-section">
        <label class="form-label">收据截图</label>
        <div class="image-upload" @click="triggerReceiptUpload">
          <img v-if="receiptPreview" :src="receiptPreview" alt="收据截图" class="preview-img" />
          <div v-else class="upload-placeholder">
            <span class="upload-icon">🧾</span>
            <span class="upload-text">点击上传</span>
          </div>
          <input
            ref="receiptInput"
            type="file"
            accept="image/*"
            class="file-input"
            @change="handleReceiptChange"
          />
        </div>
        <button v-if="receiptPreview" class="clear-btn" @click="clearReceipt">
          清除
        </button>
      </div>

      <!-- 文字内容 -->
      <div class="form-section">
        <label class="form-label">评论内容（可选）</label>
        <textarea
          v-model="content"
          class="content-input"
          placeholder="分享你的心得..."
          maxlength="200"
        ></textarea>
        <span class="char-count">{{ content.length }}/200</span>
      </div>
    </div>

    <!-- 底部提交按钮 -->
    <div class="submit-section">
      <button 
        class="submit-btn" 
        :disabled="!canSubmit || submitting"
        @click="submitPost"
      >
        {{ submitting ? '发布中...' : '发布帖子' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCompletedWithdraws, createPost, type CompletedWithdraw } from '@/api/community'

const router = useRouter()

// 状态
const showOrderPicker = ref(false)
const completedOrders = ref<CompletedWithdraw[]>([])
const ordersLoading = ref(true)
const selectedOrder = ref<CompletedWithdraw | null>(null)
const platformImage = ref<File | null>(null)
const platformPreview = ref<string | null>(null)
const receiptImage = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)
const content = ref('')
const submitting = ref(false)

const platformInput = ref<HTMLInputElement | null>(null)
const receiptInput = ref<HTMLInputElement | null>(null)

// 判断是否可以提交
const canSubmit = computed(() => {
  return selectedOrder.value && platformImage.value && receiptImage.value
})

// 加载已完成的订单
const loadOrders = async () => {
  try {
    ordersLoading.value = true
    const data = await getCompletedWithdraws()
    completedOrders.value = data.list
  } catch (e) {
    console.error('Failed to load orders:', e)
  } finally {
    ordersLoading.value = false
  }
}

// 切换订单选择器
const toggleOrderPicker = () => {
  showOrderPicker.value = !showOrderPicker.value
}

// 选择订单
const selectOrder = (order: CompletedWithdraw) => {
  selectedOrder.value = order
  showOrderPicker.value = false
}

// 触发平台截图上传
const triggerPlatformUpload = () => {
  platformInput.value?.click()
}

// 触发收据截图上传
const triggerReceiptUpload = () => {
  receiptInput.value?.click()
}

// 处理平台截图选择
const handlePlatformChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  platformImage.value = file
  platformPreview.value = URL.createObjectURL(file)
}

// 处理收据截图选择
const handleReceiptChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  receiptImage.value = file
  receiptPreview.value = URL.createObjectURL(file)
}

// 清除平台截图
const clearPlatform = () => {
  platformImage.value = null
  if (platformPreview.value) {
    URL.revokeObjectURL(platformPreview.value)
  }
  platformPreview.value = null
}

// 清除收据截图
const clearReceipt = () => {
  receiptImage.value = null
  if (receiptPreview.value) {
    URL.revokeObjectURL(receiptPreview.value)
  }
  receiptPreview.value = null
}

// 格式化金额
const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`
}

// 提交帖子
const submitPost = async () => {
  if (!canSubmit.value || submitting.value) return

  try {
    submitting.value = true
    
    // 这里需要先上传图片到服务器，获取URL后再提交帖子
    // 简化处理：假设图片已上传或使用本地预览URL（生产环境需替换为真实上传）
    const platformUrl = platformPreview.value || ''
    const receiptUrl = receiptPreview.value || ''

    await createPost({
      withdrawOrderId: selectedOrder.value!.id,
      platformImage: platformUrl,
      receiptImage: receiptUrl,
      content: content.value.trim() || undefined
    })

    alert('发布成功！')
    router.back()
  } catch (e) {
    console.error('Failed to create post:', e)
    alert('发布失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => router.back()

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.create-page {
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

.content {
  padding: 16px;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

/* 订单选择器 */
.order-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  cursor: pointer;
}

.order-picker.active {
  border-color: #3b82f6;
}

.selected-order {
  font-size: 14px;
  color: #333;
}

.placeholder-text {
  font-size: 14px;
  color: #999;
}

.arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.order-picker.active .arrow {
  transform: rotate(180deg);
}

.order-list {
  margin-top: 8px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  max-height: 200px;
  overflow-y: auto;
}

.loading-text,
.empty-text {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.order-item:last-child {
  border-bottom: none;
}

.order-item:hover {
  background: #f9f9f9;
}

.order-no {
  font-size: 14px;
  color: #333;
}

.order-amount {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
}

/* 图片上传 */
.image-upload {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 12px;
  border: 2px dashed #ddd;
  overflow: hidden;
  cursor: pointer;
  background: #fafafa;
}

.image-upload:hover {
  border-color: #3b82f6;
}

.file-input {
  display: none;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #999;
}

.clear-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

/* 内容输入 */
.content-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  resize: vertical;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.content-input::placeholder {
  color: #999;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 提交按钮 */
.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px) + 68px);
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
