import request from './request'

// 获取首页banner
export const getBannerList = () => {
  return request.get('/banner/list')
}
