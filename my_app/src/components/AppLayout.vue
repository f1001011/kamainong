<template>
  <div class="app-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">AVIVA</div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item">
          <Home :size="20" />
          <span>Inicio</span>
        </router-link>
        <router-link to="/products" class="nav-item">
          <Package :size="20" />
          <span>Productos</span>
        </router-link>
        <router-link to="/investments" class="nav-item">
          <TrendingUp :size="20" />
          <span>Mis Inversiones</span>
        </router-link>
        <router-link to="/team" class="nav-item">
          <Users :size="20" />
          <span>Mi Equipo</span>
        </router-link>
        <router-link to="/vip" class="nav-item">
          <Crown :size="20" />
          <span>VIP</span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <Settings :size="20" />
          <span>Configuración</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-details">
            <div class="user-phone">{{ userPhone }}</div>
            <div class="user-link">Ver perfil</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Home, Package, TrendingUp, Users, Crown, Settings } from 'lucide-vue-next'

const userPhone = computed(() => {
  const phone = localStorage.getItem('userPhone') || '3888888888'
  return phone
})

const userInitial = computed(() => {
  return userPhone.value.charAt(0)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #0a0e27;
}

.sidebar {
  width: 240px;
  background: rgba(15,20,40,0.95);
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #00e5ff;
  text-align: center;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.9);
}

.nav-item.router-link-active {
  background: rgba(0,229,255,0.1);
  color: #00e5ff;
  border-right: 3px solid #00e5ff;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0,229,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00e5ff;
  font-weight: 600;
}

.user-details {
  flex: 1;
}

.user-phone {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

.user-link {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
}
</style>
