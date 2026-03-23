import request from './request'

export const createWithdraw = (data: { amount: number; bankCard: string }) => request.post('/withdraw/create', data)
export const getWithdrawHistory = () => request.get('/withdraw/history')
export const getBankCards = () => request.get('/withdraw/cards')
