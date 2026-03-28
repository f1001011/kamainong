<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="modelValue"
        class="popup-overlay"
        :style="{ zIndex: zIndex }"
        @click.self="onOverlayClick"
      >
        <div class="popup-box" :class="{ 'popup-breathing': breathing }" :style="boxStyle">
          <!-- 关闭按钮 -->
          <button
            v-if="showClose"
            class="popup-close-btn"
            :style="{ color: textColor }"
            aria-label="关闭"
            @click="close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 内容插槽 -->
          <div class="popup-inner">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, watch, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  /** 弹窗宽度，如 '400px' '80%' */
  width?: string
  /** 弹窗最小高度 */
  minHeight?: string
  /** 背景色，支持渐变，如 'linear-gradient(...)' */
  bgColor?: string
  /** 字体颜色 */
  textColor?: string
  /** true=显示叉关闭按钮；false=不显示，默认1秒后自动关闭 */
  showClose?: boolean
  /** showClose=false 时自动关闭的延迟毫秒数，默认 1000 */
  autoCloseDuration?: number
  /** 点击遮罩是否关闭 */
  closeOnOverlay?: boolean
  /** 是否开启呼吸动画 */
  breathing?: boolean
  /** 圆角大小 */
  borderRadius?: string
  /** z-index 层级 */
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: '420px',
  minHeight: 'auto',
  bgColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)',
  textColor: '#ffffff',
  showClose: true,
  autoCloseDuration: 1000,
  closeOnOverlay: false,
  breathing: true,
  borderRadius: '20px',
  zIndex: 9999,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'close'): void
}>()

let timer: ReturnType<typeof setTimeout> | null = null

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onOverlayClick = () => {
  if (props.closeOnOverlay) close()
}

const clearTimer = () => {
  if (timer) { clearTimeout(timer); timer = null }
}

watch(
  () => props.modelValue,
  (val) => {
    clearTimer()
    if (val && !props.showClose) {
      timer = setTimeout(close, props.autoCloseDuration)
    }
  },
  { immediate: true }
)

onUnmounted(clearTimer)

const boxStyle = computed(() => ({
  width: props.width,
  minHeight: props.minHeight,
  background: props.bgColor,
  color: props.textColor,
  borderRadius: props.borderRadius,
}))
</script>

<style scoped>
/* ── 遮罩层 ── */
.popup-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── 弹窗主体 ── */
.popup-box {
  position: relative;
  padding: 40px 36px 36px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.07),
    0 24px 64px rgba(0, 0, 0, 0.55),
    0 0 60px rgba(99, 102, 241, 0.12);
  overflow: hidden;
  max-width: 92vw;
  max-height: 88vh;
  overflow-y: auto;
}

/* 磨砂光晕伪元素 */
.popup-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
  border-radius: inherit;
}

/* ── 呼吸动画 ── */
.popup-breathing {
  animation: breathing 3.5s ease-in-out infinite;
}

@keyframes breathing {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.07),
      0 24px 64px rgba(0, 0, 0, 0.55),
      0 0 40px rgba(99, 102, 241, 0.1);
    transform: scale(1);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.13),
      0 28px 72px rgba(0, 0, 0, 0.6),
      0 0 90px rgba(99, 102, 241, 0.28);
    transform: scale(1.006);
  }
}

/* ── 关闭按钮 ── */
.popup-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.25s ease;
  z-index: 1;
}

.popup-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* ── 内容区 ── */
.popup-inner {
  position: relative;
  z-index: 1;
}

/* ── 进出场动画 ── */
.popup-fade-enter-active {
  transition: opacity 0.3s ease;
}
.popup-fade-leave-active {
  transition: opacity 0.22s ease;
}
.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-active .popup-box {
  transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.popup-fade-leave-active .popup-box {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.popup-fade-enter-from .popup-box {
  transform: scale(0.84) translateY(28px);
  opacity: 0;
}
.popup-fade-leave-to .popup-box {
  transform: scale(0.9) translateY(12px);
  opacity: 0;
}
</style>

<!--
所有 Props
Prop	类型	默认值	说明
v-model	boolean	—	控制显隐
width	string	'420px'	宽度
minHeight	string	'auto'	最小高度
bgColor	string	深蓝渐变	背景色，支持渐变
textColor	string	'#ffffff'	字体颜色
showClose	boolean	true	true=显示叉；false=自动关闭
autoCloseDuration	number	1000	自动关闭延迟（ms）
closeOnOverlay	boolean	false	点击遮罩是否关闭
breathing	boolean	true	呼吸光晕动画
borderRadius	string	'20px'	圆角
zIndex	number	9999	层级
使用方式
基础用法（带叉关闭按钮）


<script setup>
import { ref } from 'vue'
import PopupModal from '@/components/PopupModal.vue'

const show = ref(false)
</script>

<template>
  <button @click="show = true">打开弹窗</button>

  <PopupModal v-model="show">
    <h2>标题</h2>
    <p>这里是弹窗内容</p></PopupModal>
</template>
无叉按钮 → 1秒后自动关闭


<PopupModal v-model="show" :show-close="false">
  <p>操作成功！</p>
</PopupModal>
自定义大小 /颜色


<PopupModal
  v-model="show"
  width="600px"
  min-height="300px"
  bg-color="linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
  text-color="#e0f7fa"
  border-radius="28px"
>
  内容
</PopupModal>

在组件里用（配合 i18n）


<script setup>
import { usePopup } from '@/composables/usePopup'
import { useI18n } from'vue-i18n'

const { showPopup } = usePopup()
const { t } = useI18n()

// 表单校验
const validate = () => {
  if (!form.username) {
    showPopup(t('validation.required'), { showClose: true, bgColor: 'linear-gradient(135deg,#7f1d1d,#991b1b)' })
    return false
  }
}
</script>
在接口拦截器里用（axios）


// src/api/request.ts
import { usePopup } from '@/composables/usePopup'
import i18n from '@/main' // 或单独导出i18n 实例

const { showPopup } = usePopup()

axios.interceptors.response.use(
  (res) => {
    if (res.data.code === 200) {
      // 成功提示，无叉，1秒自动关闭
      showPopup(res.data.message)}
    return res
  },
  (err) => {
    // 错误提示，显示叉
    showPopup(err.response?.data?.message ?? '请求失败', {
      showClose: true,
      bgColor: 'linear-gradient(135deg, #1c1917, #44403c)',
    })
    return Promise.reject(err)
  }
)
i18n 在拦截器外使用的技巧

把 i18n 实例单独导出，这样在任何 .ts 文件里都能用t()：


// src/main.ts
export const i18n = createI18n({ ... })
// 然后在其他文件：
import { i18n } from '@/main'
i18n.global.t('error.network')
调用签名总结


showPopup(message, options?)

// 自动关闭（默认1秒）
showPopup('保存成功')

// 手动关闭
showPopup('密码格式不正确', { showClose: true })

// 自定义样式
showPopup('网络异常', {
  showClose: true,
  bgColor: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
  autoCloseDuration: 2000,
})
-->