import { Task } from "@/api/interface";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getTaskConfigList = (params: Task.ReqConfigParams) => {
  return http.post<Task.ResConfigListData>(PORT1 + `/task/config/list`, params);
};

export const addTaskConfig = (params: Task.SaveConfigParams) => {
  return http.post(PORT1 + `/task/config/add`, params);
};

export const updateTaskConfig = (params: Task.SaveConfigParams) => {
  return http.post(PORT1 + `/task/config/update`, params);
};

export const deleteTaskConfig = (params: Task.DeleteParams) => {
  return http.post(PORT1 + `/task/config/delete`, params);
};

export const getTaskProgressList = (params: Task.ReqProgressParams) => {
  return http.post<Task.ResProgressListData>(PORT1 + `/task/progress/list`, params);
};

export const getTaskRewardLogList = (params: Task.ReqRewardLogParams) => {
  return http.post<Task.ResRewardLogListData>(PORT1 + `/task/reward/log/list`, params);
};

export const getTaskRewardStats = (params: Task.RewardStatsParams) => {
  return http.post<Task.RewardStatsData>(PORT1 + `/task/reward/log/stats`, params);
};
