/**
 * @file 签到记录接口
 * @description 获取用户签到记录，用于日历展示
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10.3节 - 签到记录
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { signInService } from '@/services/signin.service';

/**
 * GET /api/signin/records
 * @description 获取签到记录
 * @auth 需要登录
 * @query days 查询天数，默认7天
 * @returns {SignInRecordsResult} 签到记录列表
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "records": [
 *       {
 *         "date": "2026-02-03",
 *         "signed": true,
 *         "signType": "NORMAL",
 *         "amount": "1.00",
 *         "signedAt": "2026-02-03T08:30:00.000Z"
 *       },
 *       {
 *         "date": "2026-02-02",
 *         "signed": false,
 *         "signType": null,
 *         "amount": null,
 *         "signedAt": null
 *       }
 *     ],
 *     "svipRecords": [
 *       {
 *         "date": "2026-02-03",
 *         "signed": true,
 *         "signType": "SVIP",
 *         "amount": "8.00",
 *         "signedAt": "2026-02-03T08:30:00.000Z"
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, userId) => {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    
    // 解析天数参数，默认7天，最大30天
    let days = 7;
    if (daysParam) {
      const parsedDays = parseInt(daysParam, 10);
      if (!isNaN(parsedDays) && parsedDays > 0 && parsedDays <= 30) {
        days = parsedDays;
      }
    }

    const result = await signInService.getSignInRecords(userId, days);
    return successResponse(result);
  });
}
