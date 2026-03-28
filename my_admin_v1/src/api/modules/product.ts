import { GoodsOrder, IncomeClaimLog, Wares, WaresOrder, WithdrawShowcase } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 产品扩展模块
 */
export const getWaresList = (params: Wares.ReqParams) => {
  return http.post<Wares.ResListData>(PORT1 + `/wares/list`, params);
};

export const addWares = (params: Wares.SaveParams) => {
  return http.post(PORT1 + `/wares/add`, params);
};

export const updateWares = (params: Wares.SaveParams) => {
  return http.post(PORT1 + `/wares/update`, params);
};

export const deleteWares = (params: Wares.DeleteParams) => {
  return http.post(PORT1 + `/wares/delete`, params);
};

export const getGoodsOrderList = (params: GoodsOrder.ReqParams) => {
  return http.post<GoodsOrder.ResListData>(PORT1 + `/goods/order/list`, params);
};

export const getIncomeClaimLogList = (params: IncomeClaimLog.ReqParams) => {
  return http.post<IncomeClaimLog.ResListData>(PORT1 + `/income/claim/log/list`, params);
};

export const getWaresOrderList = (params: WaresOrder.ReqParams) => {
  return http.post<WaresOrder.ResListData>(PORT1 + `/wares/order/list`, params);
};

export const getWithdrawShowcaseList = (params: WithdrawShowcase.ReqParams) => {
  return http.post<WithdrawShowcase.ResListData>(PORT1 + `/withdraw/showcase/list`, params);
};

export const getWithdrawShowcaseStats = (params: WithdrawShowcase.StatsParams) => {
  return http.post<WithdrawShowcase.StatsData>(PORT1 + `/withdraw/showcase/stats`, params);
};

export const getWithdrawShowcaseDetail = (params: WithdrawShowcase.DetailParams) => {
  return http.post<WithdrawShowcase.ResListItem>(PORT1 + `/withdraw/showcase/detail`, params);
};

export const addWithdrawShowcase = (params: WithdrawShowcase.SaveParams) => {
  return http.post(PORT1 + `/withdraw/showcase/add`, params);
};

export const updateWithdrawShowcase = (params: WithdrawShowcase.SaveParams) => {
  return http.post(PORT1 + `/withdraw/showcase/update`, params);
};

export const deleteWithdrawShowcase = (params: WithdrawShowcase.DeleteParams) => {
  return http.post(PORT1 + `/withdraw/showcase/delete`, params);
};

export const getWithdrawCommentList = (params: WithdrawShowcase.CommentReqParams) => {
  return http.post<WithdrawShowcase.CommentListData>(PORT1 + `/withdraw/showcase/comment/list`, params);
};

export const addWithdrawComment = (params: WithdrawShowcase.SaveCommentParams) => {
  return http.post(PORT1 + `/withdraw/showcase/comment/add`, params);
};

export const updateWithdrawComment = (params: Pick<WithdrawShowcase.SaveCommentParams, "id" | "content">) => {
  return http.post(PORT1 + `/withdraw/showcase/comment/update`, params);
};

export const deleteWithdrawComment = (params: WithdrawShowcase.DeleteParams) => {
  return http.post(PORT1 + `/withdraw/showcase/comment/delete`, params);
};
