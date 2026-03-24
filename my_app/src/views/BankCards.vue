<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">银行卡</h1>
      <button class="nav-btn" @click="router.push('/bank-cards/add')">
        <Plus :size="24" />
      </button>
    </div>

    <div class="bank-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="bankCards.length === 0" class="empty">
        暂无银行卡
        <button class="add-btn" @click="router.push('/bank-cards/add')">添加银行卡</button>
      </div>
      <div v-else>
        <div v-for="card in bankCards" :key="card.id" class="bank-card">
          <div class="bank-name">{{ card.bankName }}</div>
          <div class="bank-number">{{ formatCardNumber(card.cardNumber) }}</div>
          <div class="bank-holder">{{ card.holderName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

const isLoading = ref(true)
const bankCards = ref<any[]>([])

function formatCardNumber(num: string): string {
  return num.slice(0, 4) + ' **** **** ' + num.slice(-4)
}

async function loadBankCards() {
  try {
    isLoading.value = true
    const res = await request.get('/bank-cards')
    bankCards.value = res.list || []
  } catch (e) {
    console.error('加载银行卡失败', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadBankCards()
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

.add-btn {
  display: block;
  margin: 16px auto 0;
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.bank-card {
  margin: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  color: white;
}

.bank-name {
  font-size: 16px;
  font-weight: 600;
}

.bank-number {
  font-size: 20px;
  font-weight: 700;
  margin-top: 16px;
  letter-spacing: 2px;
}

.bank-holder {
  font-size: 12px;
  margin-top: 16px;
  opacity: 0.8;
}
</style>
