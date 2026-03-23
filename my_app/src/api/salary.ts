import request from './request'

export const getSalaryConfig = () => request.get('/salary/config')
export const claimSalary = (id: number) => request.post('/salary/claim', { id })
