<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">AVIVA</div>
        <div class="nav-links">
          <a href="#home">Inicio</a>
          <a href="#products">Productos</a>
          <a href="#about">Nosotros</a>
        </div>
        <div class="nav-actions">
          <button class="btn-login" @click="$router.push('/login')">Iniciar Sesión</button>
          <button class="btn-register" @click="$router.push('/register')">Comenzar</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Inversiones que construyen su futuro</h1>
        <p class="hero-subtitle">Con más de 65 años de experiencia global, AVIVA transforma el panorama de inversión inmobiliaria con transparencia, rentabilidad y confianza.</p>
        <div class="hero-buttons">
          <button class="btn-primary" @click="$router.push('/products')">Comenzar Ahora</button>
          <button class="btn-secondary" @click="$router.push('/login')">Iniciar Sesión</button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <div class="stat-number">65+</div>
          <div class="stat-label">Años de confianza</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">10K+</div>
          <div class="stat-label">Inversores activos</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">98%</div>
          <div class="stat-label">Satisfacción</div>
        </div>
      </div>
    </section>

    <!-- Products Section -->
    <section class="products-section">
      <div class="section-header">
        <h2>Nuestros Productos</h2>
        <p>Inversiones inteligentes para cada perfil</p>
      </div>
      <div class="products-grid">
        <div v-for="product in products" :key="product.id" class="product-card" @click="goToProduct(product.id)">
          <div class="product-badge" v-if="product.status === 2">Próximamente</div>
          <h3>{{ product.goods_name }}</h3>
          <div class="product-price">{{ product.goods_money }} XAF</div>
          <div class="product-info">
            <div class="info-item">
              <span>Rendimiento</span>
              <span class="highlight">{{ product.revenue_lv }}%</span>
            </div>
            <div class="info-item">
              <span>Período</span>
              <span>{{ product.period }} días</span>
            </div>
          </div>
          <button class="product-btn">Ver Detalles</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const products = ref([])

onMounted(async () => {
  const res = await fetch('/api/product/list')
  const data = await res.json()
  if (data.code === 200) {
    products.value = data.data.slice(0, 4)
  }
})

const goToProduct = (id: number) => {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #fff;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-links a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.btn-login, .btn-register {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-login {
  background: transparent;
  color: #667eea;
}

.btn-register {
  background: #667eea;
  color: white;
}

/* Hero Section */
.hero-section {
  padding: 120px 20px 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 18px;
  max-width: 700px;
  margin: 0 auto 40px;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 60px;
}

.btn-primary, .btn-secondary {
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  font-weight: 600;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.hero-stats {
  display: flex;
  gap: 60px;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* Products Section */
.products-section {
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-header h2 {
  font-size: 36px;
  color: #333;
  margin-bottom: 12px;
}

.section-header p {
  color: #666;
  font-size: 16px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
}

.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f59e0b;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.product-card h3 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #333;
}

.product-price {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 16px;
}

.product-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.info-item .highlight {
  color: #667eea;
  font-weight: 600;
}

.product-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.product-btn:hover {
  background: #5568d3;
}
</style>
