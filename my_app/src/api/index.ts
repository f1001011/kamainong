import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.token = token
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    const { code, msg, data } = response.data
    if (code === 200) {
      return data
    } else if (code === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(new Error(msg || '未授权'))
    } else {
      return Promise.reject(new Error(msg || '请求失败'))
    }
  },
  error => Promise.reject(error)
)

export default api
