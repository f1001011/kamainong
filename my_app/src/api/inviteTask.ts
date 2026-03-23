import request from './request'

// 获取任务配置
export const getTaskConfig = () => {
  return request.get('/invite_task/config')
}

// 获取我的任务进度
export const getMyProgress = () => {
  return request.get('/invite_task/my_progress')
}
