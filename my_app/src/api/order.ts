import request from './request'

export const buyProduct = (data: { goods_id: number }) =>
  request.post('/order/buy', data)

export const getMyOrders = () => request.get('/order/myOrders')

export const getOrderDetail = (order_id: number) =>
  request.get('/order/detail', { params: { order_id } })
