import request from './request'

export const getRechargeChannels = () => request.get('/recharge/channels')
export const createRecharge = (data: { amount: number; channel: string }) => request.post('/recharge/create', data)
export const getRechargeHistory = () => request.get('/recharge/history')
