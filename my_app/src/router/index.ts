import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import BalanceCenter from '../views/BalanceCenter.vue'
import Products from '../views/Products.vue'
import Vip from '../views/Vip.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Investments from '../views/Investments.vue'
import Team from '../views/Team.vue'
import Income from '../views/Income.vue'
import Prize from '../views/Prize.vue'
import Settings from '../views/Settings.vue'
import InviteTask from '../views/InviteTask.vue'
import Salary from '../views/Salary.vue'
import UploadProof from '../views/UploadProof.vue'
import ExchangeProducts from '../views/ExchangeProducts.vue'
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
    { path: '/vip', name: 'Vip', component: Vip, meta: { requiresAuth: true } },
    { path: '/product/:id', name: 'ProductDetail', component: ProductDetail, meta: { requiresAuth: true } },
    { path: '/investments', name: 'Investments', component: Investments, meta: { requiresAuth: true } },
    { path: '/team', name: 'Team', component: Team, meta: { requiresAuth: true } },
    { path: '/income', name: 'Income', component: Income, meta: { requiresAuth: true } },
    { path: '/prize', name: 'Prize', component: Prize, meta: { requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
    { path: '/invite-task', name: 'InviteTask', component: InviteTask, meta: { requiresAuth: true } },
    { path: '/salary', name: 'Salary', component: Salary, meta: { requiresAuth: true } },
    { path: '/upload-proof', name: 'UploadProof', component: UploadProof, meta: { requiresAuth: true } },
    { path: '/exchange-products', name: 'ExchangeProducts', component: ExchangeProducts, meta: { requiresAuth: true } },
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