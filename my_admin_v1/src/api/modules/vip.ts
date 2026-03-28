import { Vip } from "@/api/interface";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getVipList = (params: Vip.ReqVipParams) => {
  return http.post<Vip.ResVipListData>(PORT1 + `/vip/list`, params);
};

export const addVip = (params: Vip.SaveVipParams) => {
  return http.post(PORT1 + `/vip/add`, params);
};

export const updateVip = (params: Vip.SaveVipParams) => {
  return http.post(PORT1 + `/vip/update`, params);
};

export const deleteVip = (params: Vip.DeleteParams) => {
  return http.post(PORT1 + `/vip/delete`, params);
};

export const getVipLogList = (params: Vip.ReqVipLogParams) => {
  return http.post<Vip.ResVipLogListData>(PORT1 + `/vip/log/list`, params);
};

export const getVipDailyRewardLogList = (params: Vip.ReqVipDailyRewardLogParams) => {
  return http.post<Vip.ResVipDailyRewardLogListData>(PORT1 + `/vip/daily/reward/log/list`, params);
};

export const getAgentLevelConfigList = (params: Vip.ReqAgentLevelConfigParams) => {
  return http.post<Vip.ResAgentLevelConfigListData>(PORT1 + `/agent/level/config/list`, params);
};

export const addAgentLevelConfig = (params: Vip.SaveAgentLevelConfigParams) => {
  return http.post(PORT1 + `/agent/level/config/add`, params);
};

export const updateAgentLevelConfig = (params: Vip.SaveAgentLevelConfigParams) => {
  return http.post(PORT1 + `/agent/level/config/update`, params);
};

export const deleteAgentLevelConfig = (params: Vip.DeleteParams) => {
  return http.post(PORT1 + `/agent/level/config/delete`, params);
};
