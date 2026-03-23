import request from './request'

export const getSystemConfig = (key: string) => request.get('/system/config', { params: { key } })
