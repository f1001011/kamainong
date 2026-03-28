import { Cash, Coupon, PayChannel, PayMoneyLog, Recharge, RechargeVoucher } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 支付/财务模块
 */
export const getPayMoneyLogList = (params: PayMoneyLog.ReqParams) => {
  return http.post<PayMoneyLog.ResListData>(PORT1 + `/pay/money/log/list`, params);
};

export const getPayMoneyLogStats = (params: PayMoneyLog.StatsParams) => {
  return http.post<PayMoneyLog.StatsData>(PORT1 + `/pay/money/log/stats`, params);
};

export const getRechargeList = (params: Recharge.ReqParams) => {
  return http.post<Recharge.ResListData>(PORT1 + `/pay/recharge/list`, params);
};

export const getRechargeStats = (params: Recharge.StatsParams) => {
  return http.post<Recharge.StatsData>(PORT1 + `/pay/recharge/stats`, params);
};

export const updateRechargeOrder = (params: Recharge.UpdateParams) => {
  return http.post(PORT1 + `/pay/recharge/update`, params);
};

export const getCashList = (params: Cash.ReqParams) => {
  return http.post<Cash.ResListData>(PORT1 + `/pay/cash/list`, params);
};

export const getCashStats = (params: Cash.StatsParams) => {
  return http.post<Cash.StatsData>(PORT1 + `/pay/cash/stats`, params);
};

export const updateCashOrder = (params: Cash.UpdateParams) => {
  return http.post(PORT1 + `/pay/cash/update`, params);
};

export const getPayChannelList = (params: PayChannel.ReqParams) => {
  return http.post<PayChannel.ResListData>(PORT1 + `/pay/channel/list`, params);
};

export const addPayChannel = (params: PayChannel.AddParams) => {
  return http.post(PORT1 + `/pay/channel/add`, params);
};

export const updatePayChannel = (params: PayChannel.UpdateParams) => {
  return http.post(PORT1 + `/pay/channel/update`, params);
};

export const deletePayChannel = (params: PayChannel.DeleteParams) => {
  return http.post(PORT1 + `/pay/channel/delete`, params);
};

export const getCouponList = (params: Coupon.ReqParams) => {
  return http.post<Coupon.ResListData>(PORT1 + `/pay/coupon/list`, params);
};

export const getCouponStats = (params: Coupon.StatsParams) => {
  return http.post<Coupon.StatsData>(PORT1 + `/pay/coupon/stats`, params);
};

export const getRechargeVoucherList = (params: RechargeVoucher.ReqParams) => {
  return http.post<RechargeVoucher.ResListData>(PORT1 + `/recharge/voucher/list`, params);
};

export const getRechargeVoucherStats = (params: RechargeVoucher.StatsParams) => {
  return http.post<RechargeVoucher.StatsData>(PORT1 + `/recharge/voucher/stats`, params);
};
