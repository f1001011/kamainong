import { useRouter } from 'vue-router'
import { authApi } from '../api/services'

export function useAuth() {
  const router = useRouter()

  const login = async (phone: string, password: string) => {
    const res = await authApi.login(phone, password)
    const token = (res as any).token
    if (token) localStorage.setItem('token', token)
    router.push({ name: 'Home' })
    return res
  }

  const register = async (phone: string, password: string) => {
    const res = await authApi.register(phone, password)
    router.push({ name: 'Login' })
    return res
  }

  const logout = () => {
    localStorage.removeItem('token')
    router.push({ name: 'Login' })
  }

  return { login, register, logout }
}
