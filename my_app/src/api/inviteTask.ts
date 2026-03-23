import request from './request'

// 获取任务配置
export const getTaskConfig = () => {
  return request.get('/invite_task/config')
}

// 获取我的任务进度
export const getMyProgress = () => {
  return request.get('/invite_task/my_progress')
}

// 领取任务奖励
export const claimTaskReward = (taskId: number) => {
  return request.post('/invite_task/claim', { task_id: taskId })
}

// 别名
export const getTaskProgress = getMyProgress
export const claimTask = claimTaskReward
