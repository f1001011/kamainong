import request from './request'

export const getIncomeList = () => request.get('/income/list')

export const getAvailableIncome = () => request.get('/income/available')

export const claimIncome = (claim_id: number) =>
  request.post('/income/claim', { claim_id })
