import { SysConfig } from "@/api/interface";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getSysConfigList = (params: SysConfig.ReqParams) => {
  return http.post<SysConfig.ResListData>(PORT1 + `/config/list`, params);
};

export const addSysConfig = (params: SysConfig.SaveParams) => {
  return http.post(PORT1 + `/config/add`, params);
};

export const updateSysConfig = (params: SysConfig.SaveParams) => {
  return http.post(PORT1 + `/config/update`, params);
};
