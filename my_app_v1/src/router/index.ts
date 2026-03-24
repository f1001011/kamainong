import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import { setLocale } from '@/i18n'

// ── 无需登录 ────────────────────────────────────────────────────────────────
const publicRoutes: Array<RouteRecordRaw> = [

]

// ── 需要登录 ────────────────────────────────────────────────────────────────
const authRoutes: Array<RouteRecordRaw> = [

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