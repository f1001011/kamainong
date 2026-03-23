import request from './request'

// 代理级别配置
export const getAgentConfig = () => {
  return request.get('/agent/config')
}

// 我的团队数据
export const getMyTeam = () => {
  return request.get('/agent/my_team')
}
