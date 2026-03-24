import axios, { InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
    baseURL: 'http://kamainong.com/api',
    timeout: 5000
})

// 请求拦截器：自动带 token
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token') || ''
        if (token) {
            config.headers.set('Authorization', `${token}`)
        } else {
            config.headers.delete('Authorization')
        }
        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器：统一处理 code 1 / 0 / 204
request.interceptors.response.use(
    response => {
        const { code, data, message } = response.data

        // 成功
        if (code === 1) return data

        // token 过期
        if (code === 204) {
            localStorage.removeItem('token')
            router.push({ name: 'Login' })
            return Promise.reject(new Error(message))
        }

        // 业务失败（code === 0 或其他）
        return Promise.reject(new Error(message))
    },
    error => {
        // 网络层错误（断网、超时等）
        return Promise.reject(error)
    }
)

export default request
