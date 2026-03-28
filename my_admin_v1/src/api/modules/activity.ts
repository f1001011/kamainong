import { Activity } from "@/api/interface";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getPrizePoolConfigList = (params: Activity.ReqPrizePoolConfigParams) => {
  return http.post<Activity.PrizePoolConfigListData>(PORT1 + `/prize/pool/config/list`, params);
};

export const addPrizePoolConfig = (params: Activity.SavePrizePoolConfigParams) => {
  return http.post(PORT1 + `/prize/pool/config/add`, params);
};

export const updatePrizePoolConfig = (params: Activity.SavePrizePoolConfigParams) => {
  return http.post(PORT1 + `/prize/pool/config/update`, params);
};

export const getPrizePoolLogList = (params: Activity.ReqPrizePoolLogParams) => {
  return http.post<Activity.PrizePoolLogListData>(PORT1 + `/prize/pool/log/list`, params);
};

export const getLotteryPrizeList = (params: Activity.ReqLotteryPrizeParams) => {
  return http.post<Activity.LotteryPrizeListData>(PORT1 + `/lottery/prize/list`, params);
};

export const addLotteryPrize = (params: Activity.SaveLotteryPrizeParams) => {
  return http.post(PORT1 + `/lottery/prize/add`, params);
};

export const updateLotteryPrize = (params: Activity.SaveLotteryPrizeParams) => {
  return http.post(PORT1 + `/lottery/prize/update`, params);
};

export const deleteLotteryPrize = (params: Activity.DeleteParams) => {
  return http.post(PORT1 + `/lottery/prize/delete`, params);
};

export const getLotteryLogList = (params: Activity.ReqLotteryLogParams) => {
  return http.post<Activity.LotteryLogListData>(PORT1 + `/lottery/log/list`, params);
};

export const getLotteryChanceList = (params: Activity.ReqLotteryChanceParams) => {
  return http.post<Activity.LotteryChanceListData>(PORT1 + `/lottery/chance/list`, params);
};
