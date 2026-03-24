/**
 * @file 报表服务层
 * @description 财务、用户、产品、返佣报表的 API 请求
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第16节 - 数据报表接口
 */

import { get, download } from '@/utils/request';
import { dayjs, getSystemTimezone } from '@/utils/timezone';
import type {
  DateRangeParams,
  QuickDateRange,
  FinancialReportResponse,
  UserReportResponse,
  ProductReportParams,
  ProductReportResponse,
  CommissionReportResponse,
  CommissionStatsResponse,
  CommissionListParams,
  CommissionListResponse,
} from '@/types/reports';

// ================= 工具函数 =================

/**
 * 根据快捷选项计算日期范围
 * @description 依据系统时区计算，确保与后端数据库时区一致
 */
export function getDateRangeByQuickOption(option: QuickDateRange): DateRangeParams {
  const timezone = getSystemTimezone();
  const now = dayjs().tz(timezone);
  
  switch (option) {
    case 'today':
      return {
        startDate: now.startOf('day').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD'),
      };
    case 'yesterday':
      const yesterday = now.subtract(1, 'day');
      return {
        startDate: yesterday.format('YYYY-MM-DD'),
        endDate: yesterday.format('YYYY-MM-DD'),
      };
    case 'last7days':
      return {
        startDate: now.subtract(6, 'day').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD'),
      };
    case 'last30days':
      return {
        startDate: now.subtract(29, 'day').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD'),
      };
    case 'thisMonth':
      return {
        startDate: now.startOf('month').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD'),
      };
    case 'lastMonth':
      const lastMonth = now.subtract(1, 'month');
      return {
        startDate: lastMonth.startOf('month').format('YYYY-MM-DD'),
        endDate: lastMonth.endOf('month').format('YYYY-MM-DD'),
      };
    default:
      // 默认近7天
      return {
        startDate: now.subtract(6, 'day').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD'),
      };
  }
}

/**
 * 计算同比/环比变化
 */
export function calculateTrend(
  current: number | string,
  previous: number | string
): { value: number; trend: 'up' | 'down' | 'flat'; text: string } {
  const currentNum = Number(current);
  const previousNum = Number(previous);

  if (previousNum === 0) {
    if (currentNum === 0) {
      return { value: 0, trend: 'flat', text: '0%' };
    }
    return { value: 100, trend: 'up', text: '+100%' };
  }

  const change = ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
  const rounded = Math.round(change * 10) / 10;

  if (rounded > 0) {
    return { value: rounded, trend: 'up', text: `+${rounded}%` };
  } else if (rounded < 0) {
    return { value: Math.abs(rounded), trend: 'down', text: `${rounded}%` };
  } else {
    return { value: 0, trend: 'flat', text: '0%' };
  }
}

/**
 * 格式化大数字
 * @description 如 10500 -> "1.05万"
 */
export function formatLargeNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`;
  }
  return num.toLocaleString();
}

// ================= 财务报表 =================

/**
 * 获取财务报表数据
 * @description 依据：GET /api/admin/reports/financial
 */
export async function getFinancialReport(
  params: DateRangeParams
): Promise<FinancialReportResponse> {
  return get<FinancialReportResponse>('/reports/financial', params);
}

/**
 * 导出财务报表
 */
export async function exportFinancialReport(
  params: DateRangeParams
): Promise<void> {
  const filename = `财务报表_${params.startDate}_至_${params.endDate}.xlsx`;
  await download('/reports/financial/export', params, filename);
}

// ================= 用户报表 =================

/**
 * 获取用户报表数据
 * @description 依据：GET /api/admin/reports/users
 */
export async function getUserReport(
  params: DateRangeParams
): Promise<UserReportResponse> {
  return get<UserReportResponse>('/reports/users', params);
}

/**
 * 导出用户报表
 */
export async function exportUserReport(
  params: DateRangeParams
): Promise<void> {
  const filename = `用户报表_${params.startDate}_至_${params.endDate}.xlsx`;
  await download('/reports/users/export', params, filename);
}

// ================= 产品报表 =================

/**
 * 获取产品报表数据
 * @description 依据：GET /api/admin/reports/products
 */
export async function getProductReport(
  params: ProductReportParams
): Promise<ProductReportResponse> {
  return get<ProductReportResponse>('/reports/products', params);
}

/**
 * 导出产品报表
 */
export async function exportProductReport(
  params: ProductReportParams
): Promise<void> {
  const filename = `产品报表_${params.startDate}_至_${params.endDate}.xlsx`;
  await download('/reports/products/export', params, filename);
}

// ================= 返佣报表 =================

/**
 * 获取返佣报表数据
 * @description 依据：GET /api/admin/reports/commission
 */
export async function getCommissionReport(
  params: DateRangeParams
): Promise<CommissionReportResponse> {
  return get<CommissionReportResponse>('/reports/commission', params);
}

/**
 * 获取返佣统计数据（含排行）
 * @description 依据：GET /api/admin/commissions/stats
 */
export async function getCommissionStats(
  params: DateRangeParams
): Promise<CommissionStatsResponse> {
  return get<CommissionStatsResponse>('/commissions/stats', params);
}

/**
 * 获取返佣明细列表
 * @description 依据：GET /api/admin/commissions
 */
export async function getCommissionList(
  params: CommissionListParams
): Promise<CommissionListResponse> {
  return get<CommissionListResponse>('/commissions', params);
}

/**
 * 导出返佣报表
 */
export async function exportCommissionReport(
  params: DateRangeParams
): Promise<void> {
  const filename = `返佣报表_${params.startDate}_至_${params.endDate}.xlsx`;
  await download('/reports/commission/export', params, filename);
}

// ================= 通用导出 =================

/**
 * 前端导出 Excel（使用 xlsx 库）
 * @description 当后端不支持导出时，前端自行生成
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: Array<{ header: string; key: string; width?: number }>,
  filename: string
): Promise<void> {
  // 动态导入 xlsx 库
  const XLSX = await import('xlsx');
  
  // 构建表头
  const headers = columns.map(col => col.header);
  
  // 构建数据行
  const rows = data.map(item => 
    columns.map(col => item[col.key] ?? '')
  );
  
  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // 设置列宽
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));
  
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // 下载文件
  XLSX.writeFile(wb, filename);
}

/**
 * 前端导出多 Sheet Excel
 */
export async function exportMultiSheetExcel(
  sheets: Array<{
    name: string;
    data: Record<string, unknown>[];
    columns: Array<{ header: string; key: string; width?: number }>;
  }>,
  filename: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    const headers = sheet.columns.map(col => col.header);
    const rows = sheet.data.map(item => 
      sheet.columns.map(col => item[col.key] ?? '')
    );
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = sheet.columns.map(col => ({ wch: col.width || 15 }));
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  XLSX.writeFile(wb, filename);
}
