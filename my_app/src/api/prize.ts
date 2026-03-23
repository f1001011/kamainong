import request from './request'

export const getPrizeConfig = () => request.get('/prize/config')
export const getTodayRank = () => request.get('/prize/todayRank')
export const getWinners = () => request.get('/prize/winners')
