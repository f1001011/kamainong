import request from './request'

export const getSalaryConfig = () => request.get('/salary/config')

export const claimSalary = () => request.post('/salary/claim')
