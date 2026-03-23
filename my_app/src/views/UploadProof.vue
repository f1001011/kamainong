<template>
  <div class="upload-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h1>{{ t('upload.title') }}</h1>
    </div>

    <div class="upload-area" @click="triggerUpload">
      <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" hidden />
      <div v-if="!preview" class="upload-placeholder">
        <Upload :size="48" />
        <span>{{ t('upload.clickToUpload') }}</span>
      </div>
      <img v-else :src="preview" class="preview-image" />
    </div>

    <button class="submit-btn" :disabled="!file" @click="handleSubmit">
      {{ t('upload.submit') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Upload } from 'lucide-vue-next'
import { uploadWithdrawProof } from '@/api/upload'

const router = useRouter()
const { t } = useI18n()

const fileInput = ref<HTMLInputElement>()
const file = ref<File>()
const preview = ref('')

const triggerUpload = () => fileInput.value?.click()

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    file.value = target.files[0]
    preview.value = URL.createObjectURL(file.value)
  }
}

const handleSubmit = async () => {
  if (!file.value) return
  const formData = new FormData()
  formData.append('file', file.value)
  await uploadWithdrawProof(formData)
  router.back()
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.upload-area {
  background: rgba(255, 255, 255, 0.04);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.preview-image {
  max-width: 100%;
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
