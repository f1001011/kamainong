import request from './request'

export const getUserInfo = () => request.get('/user/info')

export const getBalance = () => request.get('/user/balance')

export const changePassword = (data: { old_pwd: string; new_pwd: string }) =>
  request.post('/user/changePassword', data)
