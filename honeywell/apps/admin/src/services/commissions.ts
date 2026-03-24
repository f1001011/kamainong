/**
 * @file 返佣记录管理服务
 * @description 返佣记录管理相关的 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19节 - 返佣记录管理接口
 */

import { get, download } from '@/utils/request';
import { formatSystemTime } from '@/utils/timezone';
import type {
  CommissionListParams,
  CommissionListResponse,
  CommissionStatsParams,
  CommissionStatsResponse,
  CommissionExportParams,
  CommissionListItem,
  COMMISSION_LEVEL_MAP,
} from '@/types/commissions';

/**
 * 获取返佣记录列表
 * @description 依据：GET /api/admin/commissions
 */
export async function fetchCommissionList(
  params: CommissionListParams
): Promise<CommissionListResponse> {
  // 构建查询参数
  const queryParams: Record<string, unknown> = {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };

  // 添加可选参数
  if (params.receiverId) queryParams.receiverId = params.receiverId;
  if (params.receiverPhone) queryParams.receiverPhone = params.receiverPhone;
  if (params.sourceUserId) queryParams.sourceUserId = params.sourceUserId;
  if (params.sourceUserPhone) queryParams.sourceUserPhone = params.sourceUserPhone;

  // 处理返佣级别（单选/多选）
  if (params.level) {
    queryParams.level = Array.isArray(params.level) ? params.level.join(',') : params.level;
  }

  // 处理产品ID（单选/多选）
  if (params.productId) {
    queryParams.productId = Array.isArray(params.productId)
      ? params.productId.join(',')
      : params.productId;
  }

  // 时间范围
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  // 金额范围
  if (params.amountMin !== undefined) queryParams.amountMin = params.amountMin;
  if (params.amountMax !== undefined) queryParams.amountMax = params.amountMax;

  // 排序
  if (params.sortField) {
    queryParams.sortField = params.sortField;
    queryParams.sortOrder = params.sortOrder || 'descend';
  }

  return get<CommissionListResponse>('/commissions', queryParams);
}

/**
 * 获取返佣统计汇总
 * @description 依据：GET /api/admin/commissions/stats
 */
export async function fetchCommissionStats(
  params?: CommissionStatsParams
): Promise<CommissionStatsResponse> {
  const queryParams: Record<string, unknown> = {};
  
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;

  return get<CommissionStatsResponse>('/commissions/stats', queryParams);
}

/**
 * 导出返佣记录到 Excel
 * @description 后端导出方式
 */
export async function exportCommissionRecords(
  params: CommissionExportParams
): Promise<void> {
  const queryParams: Record<string, unknown> = { ...params };
  delete queryParams.format;

  // 构建文件名
  const dateStr = params.startDate && params.endDate 
    ? `${params.startDate}_至_${params.endDate}` 
    : formatSystemTime(new Date(), 'YYYYMMDD');
  const filename = `返佣记录_${dateStr}.xlsx`;

  await download('/commissions/export', queryParams, filename);
}

/**
 * 前端导出返佣记录到 Excel
 * @description 当后端不支持导出时使用前端导出
 */
export async function exportCommissionRecordsFrontend(
  data: CommissionListItem[],
  startDate?: string,
  endDate?: string
): Promise<void> {
  // 动态导入 xlsx 库
  const XLSX = await import('xlsx');

  // 返佣级别映射
  const levelTextMap: Record<string, string> = {
    LEVEL_1: '一级',
    LEVEL_2: '二级',
    LEVEL_3: '三级',
  };

  // 准备导出数据
  const exportData = data.map((item) => ({
    记录ID: item.id,
    获佣用户ID: item.receiverId,
    获佣用户手机号: item.receiverPhone,
    获佣用户昵称: item.receiverNickname || '-',
    来源用户ID: item.sourceUserId,
    来源用户手机号: item.sourceUserPhone,
    来源用户昵称: item.sourceUserNickname || '-',
    返佣级别: levelTextMap[item.level] || item.level,
    返佣比例: `${item.rate}%`,
    基础金额: item.baseAmount,
    返佣金额: item.amount,
    产品名称: item.productName,
    持仓订单号: item.positionOrderNo,
    创建时间: formatSystemTime(item.createdAt, 'YYYY-MM-DD HH:mm:ss'),
  }));

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData);

  // 设置列宽
  ws['!cols'] = [
    { wch: 10 },  // 记录ID
    { wch: 12 },  // 获佣用户ID
    { wch: 15 },  // 获佣用户手机号
    { wch: 15 },  // 获佣用户昵称
    { wch: 12 },  // 来源用户ID
    { wch: 15 },  // 来源用户手机号
    { wch: 15 },  // 来源用户昵称
    { wch: 10 },  // 返佣级别
    { wch: 10 },  // 返佣比例
    { wch: 12 },  // 基础金额
    { wch: 12 },  // 返佣金额
    { wch: 12 },  // 产品名称
    { wch: 22 },  // 持仓订单号
    { wch: 20 },  // 创建时间
  ];

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '返佣记录');

  // 生成文件名
  const dateStr = startDate && endDate
    ? `${startDate}_至_${endDate}`
    : formatSystemTime(new Date(), 'YYYYMMDD');
  const filename = `返佣记录_${dateStr}.xlsx`;

  // 下载文件
  XLSX.writeFile(wb, filename);
}

/**
 * 获取返佣记录详情
 * @description 用于查看单条记录详情（如需要）
 */
export async function fetchCommissionDetail(
  id: number
): Promise<CommissionListItem> {
  return get<CommissionListItem>(`/commissions/${id}`);
}
