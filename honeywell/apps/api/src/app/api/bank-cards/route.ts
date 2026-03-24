/**
 * @file 银行卡列表与添加接口
 * @description 处理银行卡的查询与添加
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第7节 - 银行卡接口
 * 
 * 接口清单：
 * - GET /api/bank-cards - 获取用户银行卡列表（脱敏返回）
 * - POST /api/bank-cards - 添加银行卡
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { bankCardService } from '@/services/bank-card.service';

// ================================
// 请求参数校验
// ================================

/**
 * 添加银行卡请求参数校验
 * 摩洛哥961通道仅需银行+账号+姓名+手机号，证件字段已移除
 */
const addBankCardSchema = z.object({
  /** 银行编码 */
  bankCode: z.string().min(1, 'رمز البنك مطلوب'),
  /** 银行卡号（不限制长度，只要求非空且为数字） */
  accountNo: z
    .string()
    .min(1, 'رقم الحساب مطلوب')
    .regex(/^\d+$/, 'رقم الحساب يجب أن يحتوي على أرقام فقط'),
  /** 收款人姓名（不限制长度，只要求非空） */
  accountName: z
    .string()
    .min(1, 'اسم صاحب الحساب مطلوب'),
  /** 收款人手机号（不限制长度，只要求非空且为数字） */
  phone: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^\d+$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط'),
});

// ================================
// GET /api/bank-cards - 银行卡列表
// ================================

/**
 * 获取用户银行卡列表
 * @description 依据：02.3-前端API接口清单.md 第7.1节
 * 
 * 响应格式：
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "bankCode": "MAD001",
 *         "bankName": "Attijariwafa Bank",
 *         "accountNoMask": "****3456",
 *         "accountName": "محمد أحمد",
 *         "canDelete": true
 *       }
 *     ],
 *     "maxCount": 5,
 *     "canAdd": true
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 调用服务获取银行卡列表
    // 业务错误由 withAuth 中间件统一捕获处理
    const result = await bankCardService.getBankCardList(userId);

    return successResponse(result);
  });
}

// ================================
// POST /api/bank-cards - 添加银行卡
// ================================

/**
 * 添加银行卡
 * @description 依据：02.3-前端API接口清单.md 第7.2节
 * 
 * 请求体：
 * {
 *   "bankCode": "PEN1143",
 *   "accountNo": "1234567890123456",
 *   "accountName": "Juan Perez",
 *   "phone": "987654321",
 *   "documentType": "CC",
 *   "documentNo": "12345678",
 *   "documentNo": "AB123456"
 * }
 * 
 * 响应格式：
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "bankCode": "MAD001",
 *     "bankName": "Attijariwafa Bank",
 *     "accountNoMask": "****3456",
 *     "accountName": "محمد أحمد"
 *   },
 *   "message": "Tarjeta bancaria agregada"
 * }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // 1. 解析请求体
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'صيغة الطلب غير صحيحة', 400);
    }

    // 2. 参数校验
    const parseResult = addBankCardSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return errorResponse('VALIDATION_ERROR', firstError.message, 400);
    }

    const params = parseResult.data;

    // 3. 调用服务添加银行卡
    // 业务错误由 withAuth 中间件统一捕获处理
    const result = await bankCardService.addBankCard(userId, params);

    // 4. 返回成功响应（阿拉伯语提示）
    return successResponse(result, 'تمت إضافة البطاقة البنكية');
  });
}
