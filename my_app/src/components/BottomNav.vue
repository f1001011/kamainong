<template>
  <nav v-if="showNav" class="bottom-nav">
    <div class="nav-inner">
      <button
        v-for="item in navItems"
        :key="item.name"
        :class="['nav-item', { active: isActive(item) }]"
        :style="isActive(item) ? { '--nc': item.color } : {}"
        @click="router.push(item.path)"
      >
        <div class="nav-icon-wrap">
          <component :is="item.icon" :size="20" />
          <span v-if="isActive(item)" class="nav-dot"></span>
        </div>
        <span class="nav-label">{{ t(item.labelKey) }}</span>
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Package, Crown, User } from 'lucide-vue-next'
import { colors } from '@/config/colors'

const router = useRouter()
const route  = useRoute()
const { t }  = useI18n()

const navItems = [
  { name: 'Home',          path: '/',         icon: Home,    color: colors.red,   labelKey: 'nav.home'     },
  { name: 'Products',      path: '/products', icon: Package, color: colors.cyan,  labelKey: 'nav.products' },
  { name: 'Vip',           path: '/vip',      icon: Crown,   color: colors.amber, labelKey: 'nav.vip'      },
  { name: 'BalanceCenter', path: '/balance',  icon: User,    color: colors.lime,  labelKey: 'nav.mine'     },
]

const showNav = computed(() => !['Login', 'Register'].includes(route.name as string))

function isActive(item: typeof navItems[0]) {
  return route.name === item.name
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: stretch;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--nav-bg);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
}

.nav-inner {
  width: 100%;
  max-width: 460px;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.28);
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:active { transform: scale(0.88); }

.nav-item.active {
  color: var(--nc);
  filter: drop-shadow(0 0 8px var(--nc));
}

.nav-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-dot {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--nc);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 1;
  font-family: 'Inter', 'PingFang SC', sans-serif;
}
</style>
