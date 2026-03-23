import request from './request'

// 收益列表
export const getIncomeList = () => {
  return request.get('/income/list')
}

// 可领取收益
export const getAvailableIncome = () => {
  return request.get('/income/available')
}

// 领取收益
export const claimIncome = (claimId: number) => {
  return request.post('/income/claim', { claim_id: claimId })
}

// 别名
export const getIncomeStats = getIncomeList
