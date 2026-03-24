import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Products from '../views/Products.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Recharge from '../views/Recharge.vue'
import RechargeRecords from '../views/RechargeRecords.vue'
import Withdraw from '../views/Withdraw.vue'
import WithdrawRecords from '../views/WithdrawRecords.vue'
import Transactions from '../views/Transactions.vue'
import Team from '../views/Team.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'
import BankCards from '../views/BankCards.vue'
import Messages from '../views/Messages.vue'
import About from '../views/About.vue'
import Activities from '../views/Activities.vue'
import Security from '../views/Security.vue'
import GiftCode from '../views/GiftCode.vue'
import Positions from '../views/Positions.vue'
import Community from '../views/Community.vue'
import CommunityDetail from '../views/CommunityDetail.vue'
import CommunityCreate from '../views/CommunityCreate.vue'
import CommunityMy from '../views/CommunityMy.vue'
import { setLocale } from '@/i18n'

// ── 无需登录 ────────────────────────────────────────────────────────────────
const publicRoutes: Array<RouteRecordRaw> = [
    { path: '/login',    name: 'Login',        component: Login },
    { path: '/register', name: 'Register',     component: Register },
    { path: '/',         name: 'Home',          component: Home },
]

// ── 需要登录 ────────────────────────────────────────────────────────────────
const authRoutes: Array<RouteRecordRaw> = [
    { path: '/products', name: 'Products', component: Products, meta: { requiresAuth: true } },
    { path: '/product/:id', name: 'ProductDetail', component: ProductDetail, meta: { requiresAuth: true } },
    { path: '/recharge', name: 'Recharge', component: Recharge, meta: { requiresAuth: true } },
    { path: '/recharge/records', name: 'RechargeRecords', component: RechargeRecords, meta: { requiresAuth: true } },
    { path: '/withdraw', name: 'Withdraw', component: Withdraw, meta: { requiresAuth: true } },
    { path: '/withdraw/records', name: 'WithdrawRecords', component: WithdrawRecords, meta: { requiresAuth: true } },
    { path: '/transactions', name: 'Transactions', component: Transactions, meta: { requiresAuth: true } },
    { path: '/team', name: 'Team', component: Team, meta: { requiresAuth: true } },
    { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
    { path: '/bank-cards', name: 'BankCards', component: BankCards, meta: { requiresAuth: true } },
    { path: '/messages', name: 'Messages', component: Messages, meta: { requiresAuth: true } },
    { path: '/about', name: 'About', component: About, meta: { requiresAuth: true } },
    { path: '/activities', name: 'Activities', component: Activities, meta: { requiresAuth: true } },
    { path: '/security', name: 'Security', component: Security, meta: { requiresAuth: true } },
    { path: '/gift-code', name: 'GiftCode', component: GiftCode, meta: { requiresAuth: true } },
    { path: '/positions', name: 'Positions', component: Positions, meta: { requiresAuth: true } },
    { path: '/community', name: 'Community', component: Community, meta: { requiresAuth: true } },
    { path: '/community/:id', name: 'CommunityDetail', component: CommunityDetail, meta: { requiresAuth: true } },
    { path: '/community/create', name: 'CommunityCreate', component: CommunityCreate, meta: { requiresAuth: true } },
    { path: '/community/my', name: 'CommunityMy', component: CommunityMy, meta: { requiresAuth: true } },
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