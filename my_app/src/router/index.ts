import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/main/HomeView.vue'
import Login from '../views/auth/LoginView.vue'
import Register from '../views/auth/RegisterView.vue'
import ForgotPassword from '../views/auth/ForgotPasswordView.vue'
import Welcome from '../views/public/WelcomeView.vue'
import Products from '../views/main/products/ProductsView.vue'
import HoneywellPageView from '../views/main/HoneywellPageView.vue'
import Profile from '../views/main/profile/ProfileView.vue'
import About from '../views/main/AboutView.vue'
import { setLocale } from '@/i18n'

// ── 无需登录 ────────────────────────────────────────────────────────────────
const publicRoutes: Array<RouteRecordRaw> = [
    { path: '/welcome', name: 'Welcome', component: Welcome, meta: { layout: 'public' } },
    { path: '/login', name: 'Login', component: Login, meta: { layout: 'auth' } },
    { path: '/register', name: 'Register', component: Register, meta: { layout: 'auth' } },
    { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { layout: 'auth' } },
    { path: '/', name: 'Home', component: Home, meta: { layout: 'main', requiresAuth: true } },
    { path: '/about', name: 'About', component: About, meta: { layout: 'main' } },
]

// ── 需要登录 ────────────────────────────────────────────────────────────────
const authRoutes: Array<RouteRecordRaw> = [
    { path: '/products', name: 'Products', component: Products, meta: { layout: 'main', requiresAuth: true } },
    { path: '/products/:id', name: 'ProductDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/recharge', name: 'Recharge', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/recharge/records', name: 'RechargeRecords', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/recharge/records/:id', name: 'RechargeRecordDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/withdraw', name: 'Withdraw', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/withdraw/records', name: 'WithdrawRecords', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/withdraw/records/:id', name: 'WithdrawRecordDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/transactions', name: 'Transactions', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/team', name: 'Team', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/profile', name: 'Profile', component: Profile, meta: { layout: 'main', requiresAuth: true } },
    { path: '/profile/app-download', name: 'AppDownload', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/settings/password', name: 'SettingsPassword', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/settings/security', name: 'SettingsSecurity', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/bank-cards', name: 'BankCards', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/bank-cards/add', name: 'BankCardAdd', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/messages', name: 'Messages', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/messages/:id', name: 'MessageDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities', name: 'Activities', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/weekly-salary', name: 'ActivityWeeklySalary', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/svip', name: 'ActivitySvip', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/spin-wheel', name: 'ActivitySpinWheel', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/prize-pool', name: 'ActivityPrizePool', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/invite', name: 'ActivityInvite', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/invite-reward', name: 'ActivityInviteReward', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/activities/collection', name: 'ActivityCollection', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/security', name: 'Security', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/security/password', name: 'SecurityPassword', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/gift-code', name: 'GiftCode', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/positions', name: 'Positions', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/positions/:id', name: 'PositionDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/community', name: 'Community', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/community/:id', name: 'CommunityDetail', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/community/create', name: 'CommunityCreate', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
    { path: '/community/my', name: 'CommunityMy', component: HoneywellPageView, meta: { layout: 'main', requiresAuth: true } },
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
