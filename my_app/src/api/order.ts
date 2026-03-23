import request from './request'

// 购买产品
export const buyProduct = (goodsId: number) => {
  return request.post('/order/buy', { goods_id: goodsId })
}

// 我的订单列表
export const getMyOrders = () => {
  return request.get('/order/my_orders')
}

// 订单详情
export const getOrderDetail = (orderId: number) => {
  return request.get('/order/detail', { params: { order_id: orderId } })
}
