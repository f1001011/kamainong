import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/main/HomeView.vue'
import Login from '../views/auth/LoginView.vue'
import Register from '../views/auth/RegisterView.vue'
import ForgotPassword from '../views/auth/ForgotPasswordView.vue'
import Welcome from '../views/public/WelcomeView.vue'
import Games from '../views/main/GamesView.vue'
import Sports from '../views/main/SportsView.vue'
import Profile from '../views/main/profile/ProfileView.vue'
import Recharge from '../views/main/profile/RechargeView.vue'
import Withdraw from '../views/main/profile/WithdrawView.vue'
import RecordHistory from '../views/main/profile/RecordHistoryView.vue'
import { setLocale } from '@/i18n'

const publicRoutes: Array<RouteRecordRaw> = [
  { path: '/welcome', name: 'Welcome', component: Welcome, meta: { layout: 'public' } },
  { path: '/login', name: 'Login', component: Login, meta: { layout: 'auth' } },
  { path: '/register', name: 'Register', component: Register, meta: { layout: 'auth' } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { layout: 'auth' } },
  { path: '/', name: 'Home', component: Home, meta: { layout: 'main' } },
  { path: '/games', name: 'Games', component: Games, meta: { layout: 'main' } },
  { path: '/sports', name: 'Sports', component: Sports, meta: { layout: 'main' } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { layout: 'main' } },
  { path: '/recharge', name: 'Recharge', component: Recharge, meta: { layout: 'main' } },
  { path: '/withdraw', name: 'Withdraw', component: Withdraw, meta: { layout: 'main' } },
  { path: '/records/:type', name: 'RecordHistory', component: RecordHistory, meta: { layout: 'main' } },
]

const routes: Array<RouteRecordRaw> = [...publicRoutes]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
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
