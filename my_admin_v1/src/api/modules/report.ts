import { PORT1 } from "@/api/config/servicePort";
import { Report } from "@/api/interface";
import http from "@/api";

export const getDashboardOverview = (params?: Report.DashboardOverviewParams) => {
  return http.post<Report.DashboardOverviewData>(PORT1 + `/dashboard/overview`, params);
};

export const getSignLogList = (params: Report.SignReqParams) => {
  return http.post<Report.SignListData>(PORT1 + `/report/sign/list`, params);
};

export const getSignStats = (params: Report.SignReqParams) => {
  return http.post<Report.SignStatsData>(PORT1 + `/report/sign/stats`, params);
};

export const getMonthlySalaryLogList = (params: Report.SalaryReqParams) => {
  return http.post<Report.SalaryListData>(PORT1 + `/report/monthly/salary/list`, params);
};

export const getMonthlySalaryStats = (params: Report.SalaryReqParams) => {
  return http.post<Report.SalaryStatsData>(PORT1 + `/report/monthly/salary/stats`, params);
};

export const getCommissionLogList = (params: Report.CommissionReqParams) => {
  return http.post<Report.CommissionListData>(PORT1 + `/report/commission/list`, params);
};

export const getCommissionStats = (params: Report.CommissionReqParams) => {
  return http.post<Report.CommissionStatsData>(PORT1 + `/report/commission/stats`, params);
};

export const getFinanceSummary = (params: Report.FinanceSummaryReqParams) => {
  return http.post<Report.FinanceSummaryData>(PORT1 + `/report/finance/summary`, params);
};
