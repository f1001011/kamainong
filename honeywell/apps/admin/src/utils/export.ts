/**
 * @file 导出工具函数
 * @description 前端导出 Excel 的便捷工具
 */

/**
 * 简化版导出 Excel
 * @description 直接传入对象数组，自动推断列名
 * @param data 数据数组，每项的 key 作为表头
 * @param filename 文件名（不含扩展名）
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string
): Promise<void> {
  if (!data.length) {
    throw new Error('导出数据为空');
  }

  // 动态导入 xlsx 库
  const XLSX = await import('xlsx');

  // 从第一条数据推断列名
  const headers = Object.keys(data[0]);

  // 构建数据行
  const rows = data.map(item =>
    headers.map(key => {
      const value = item[key];
      // 处理特殊值
      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    })
  );

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 自动计算列宽
  ws['!cols'] = headers.map(header => {
    // 根据表头长度和数据长度计算列宽
    const maxDataLen = Math.max(
      header.length,
      ...data.map(item => String(item[header] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxDataLen, 10), 50) };
  });

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // 生成带时间戳的文件名
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // 下载文件
  XLSX.writeFile(wb, fullFilename);
}

/**
 * 导出 CSV（轻量版）
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (!data.length) {
    throw new Error('导出数据为空');
  }

  const headers = Object.keys(data[0]);

  // 构建 CSV 内容
  const csvRows = [
    headers.join(','),
    ...data.map(item =>
      headers.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        // 处理包含逗号或换行的值
        const str = String(value);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ];

  // 创建 Blob 并下载
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
