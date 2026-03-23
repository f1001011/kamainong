import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import BalanceCenter from '../views/BalanceCenter.vue'
import Products from '../views/Products.vue'
import Vip from '../views/Vip.vue'
import { setLocale } from '@/i18n'

// ── 无需登录 ────────────────────────────────────────────────────────────────
const publicRoutes: Array<RouteRecordRaw> = [
    { path: '/login',    name: 'Login',        component: Login },
    { path: '/register', name: 'Register',     component: Register },
    { path: '/balance',  name: 'BalanceCenter', component: BalanceCenter },
    { path: '/',         name: 'Home',          component: Home },
]

// ── 需要登录 ────────────────────────────────────────────────────────────────
const authRoutes: Array<RouteRecordRaw> = [
    { path: '/products', name: 'Products', component: Products, meta: { requiresAuth: true } },
    { path: '/vip',      name: 'Vip',      component: Vip,      meta: { requiresAuth: true } },
]

const routes: Array<RouteRecordRaw> = [...publicRoutes, ...authRoutes]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    // 检测 URL 中的 lang 参数并切换语言
    if (to.query.lang) {
        setLocale(to.query.lang as string)
    }

    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) {
        next({ name: 'Login' })
    } else {
        next()
    }
})

export default router