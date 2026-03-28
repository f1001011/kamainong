import { Goods } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 商品管理模块
 */
export const getGoodsList = (params: Goods.ReqParams, config = {}) => {
  return http.post<Goods.ResListData>(PORT1 + `/goods/list`, params, config);
};

export const addGoods = (params: Goods.SaveParams) => {
  return http.post(PORT1 + `/goods/add`, params);
};

export const updateGoods = (params: Goods.SaveParams) => {
  return http.post(PORT1 + `/goods/update`, params);
};

export const deleteGoods = (params: Goods.DeleteParams) => {
  return http.post(PORT1 + `/goods/delete`, params);
};
