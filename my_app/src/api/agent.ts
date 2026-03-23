import request from './request'

export const getAgentConfig = () => request.get('/agent/config')

export const getMyTeam = () => request.get('/agent/myTeam')
