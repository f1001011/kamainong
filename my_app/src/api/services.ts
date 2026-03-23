import api from './index'

// 认证相关
export const authApi = {
  login: (phone: string, pwd: string) => 
    api.post('/login', { phone, pwd }),
  
  register: (phone: string, pwd: string) => 
    api.post('/register', { phone, pwd })
}

// 用户相关
export const userApi = {
  getInfo: () => api.get('/user/info'),
  getBalance: () => api.get('/user/balance'),
  changePassword: (old_pwd: string, new_pwd: string) => 
    api.post('/user/change_password', { old_pwd, new_pwd })
}

// 产品相关
export const productApi = {
  getList: () => api.get('/product/list'),
  getDetail: (id: number) => api.get('/product/detail', { params: { id } })
}

// 订单相关
export const orderApi = {
  buy: (goods_id: number) => api.post('/order/buy', { goods_id }),
  getMyOrders: () => api.get('/order/my_orders'),
  getDetail: (order_id: number) => api.get('/order/detail', { params: { order_id } })
}
