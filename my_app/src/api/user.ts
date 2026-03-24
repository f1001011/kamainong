import request from './request'

export const getUserInfo = () => request.get('/user/info')
export const getUserBalance = () => request.get('/user/balance')
export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  request.post('/user/change_password', {
    old_pwd: data.oldPassword,
    new_pwd: data.newPassword,
  })
