/**
 * @file 安全管理服务
 * @description 管理员、黑名单、敏感词的统一服务层
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14节 - 安全管理接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.9、2.20节
 */

import { prisma } from '@/lib/prisma';
import { BusinessError, Errors } from '@/lib/errors';
import { BlacklistType, Prisma } from '@honeywell/database';
import bcrypt from 'bcryptjs';

// ================================
// 类型定义
// ================================

/**
 * 管理员列表查询参数
 */
export interface AdminListParams {
  page: number;
  pageSize: number;
  username?: string;
  nickname?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 创建管理员参数
 */
export interface CreateAdminParams {
  username: string;
  password: string;
  nickname?: string;
  isActive?: boolean;
}

/**
 * 更新管理员参数
 */
export interface UpdateAdminParams {
  nickname?: string;
  isActive?: boolean;
}

/**
 * 黑名单列表查询参数
 */
export interface BlacklistListParams {
  page: number;
  pageSize: number;
  type: BlacklistType;
  keyword?: string;
  createdBy?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 添加黑名单参数
 */
export interface AddBlacklistParams {
  type: BlacklistType;
  value: string;
  reason?: string;
  createdBy: number;
}

/**
 * 批量导入黑名单参数
 */
export interface BatchImportBlacklistParams {
  type: BlacklistType;
  values: string[];
  reason?: string;
  createdBy: number;
}

/**
 * 敏感词列表查询参数
 */
export interface SensitiveWordListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: string;
  isActive?: boolean;
  severity?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 添加敏感词参数
 */
export interface AddSensitiveWordParams {
  word: string;
  category?: string;
  severity?: number;
  createdBy: number;
}

/**
 * 批量导入敏感词参数
 */
export interface BatchImportSensitiveWordsParams {
  words: string[];
  category?: string;
  severity?: number;
  createdBy: number;
}

// ================================
// 管理员服务
// ================================

/**
 * 获取管理员列表
 * @description 依据：02.4-后台API接口清单.md 第14.1.1节
 */
export async function getAdminList(params: AdminListParams) {
  const { page, pageSize, username, nickname, isActive, startDate, endDate, sortField, sortOrder } = params;
  
  // 构建查询条件
  const where: Prisma.AdminWhereInput = {};
  
  if (username) {
    where.username = { contains: username };
  }
  
  if (nickname) {
    where.nickname = { contains: nickname };
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  // 创建时间范围筛选
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  // 构建排序（使用函数封装以正确处理类型）
  const buildOrderBy = (): Prisma.AdminOrderByWithRelationInput => {
    if (sortField && sortOrder) {
      const direction = sortOrder === 'ascend' ? 'asc' : 'desc';
      switch (sortField) {
        case 'id': return { id: direction };
        case 'username': return { username: direction };
        case 'nickname': return { nickname: direction };
        case 'isActive': return { isActive: direction };
        case 'lastLoginAt': return { lastLoginAt: direction };
        case 'createdAt': return { createdAt: direction };
        case 'updatedAt': return { updatedAt: direction };
        default: return { id: 'asc' };
      }
    }
    return { id: 'asc' }; // 默认按ID升序（超级管理员在前）
  };
  const orderBy = buildOrderBy();
  
  // 查询数据
  const [total, list] = await Promise.all([
    prisma.admin.count({ where }),
    prisma.admin.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        username: true,
        nickname: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);
  
  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
    },
  };
}

/**
 * 创建管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.2节
 */
export async function createAdmin(params: CreateAdminParams) {
  const { username, password, nickname, isActive = true } = params;
  
  // 检查用户名是否已存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });
  
  if (existingAdmin) {
    throw Errors.adminUsernameExists();
  }
  
  // 密码哈希（使用bcrypt，依据：02.1-数据库设计.md - Admin表）
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 创建管理员
  const admin = await prisma.admin.create({
    data: {
      username,
      password: hashedPassword,
      nickname: nickname || null,
      isActive,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      isActive: true,
      createdAt: true,
    },
  });
  
  return admin;
}

/**
 * 更新管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.3节
 */
export async function updateAdmin(id: number, params: UpdateAdminParams) {
  // 检查管理员是否存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingAdmin) {
    throw Errors.adminNotFound();
  }
  
  // 更新管理员信息
  const admin = await prisma.admin.update({
    where: { id },
    data: {
      nickname: params.nickname !== undefined ? params.nickname || null : undefined,
      isActive: params.isActive !== undefined ? params.isActive : undefined,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      isActive: true,
      updatedAt: true,
    },
  });
  
  return admin;
}

/**
 * 删除管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.4节
 * 核心规则：不能删除自己，不能删除超级管理员（ID=1）
 */
export async function deleteAdmin(id: number, operatorId: number) {
  // 不能删除自己
  if (id === operatorId) {
    throw Errors.cannotDeleteSelf();
  }
  
  // 不能删除超级管理员
  if (id === 1) {
    throw Errors.cannotDeleteSuperAdmin();
  }
  
  // 检查管理员是否存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingAdmin) {
    throw Errors.adminNotFound();
  }
  
  // 删除管理员
  await prisma.admin.delete({
    where: { id },
  });
}

/**
 * 启用/禁用管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.5节
 * 核心规则：不能禁用自己，不能操作超级管理员
 */
export async function toggleAdminStatus(id: number, isActive: boolean, operatorId: number) {
  // 不能禁用自己
  if (id === operatorId && !isActive) {
    throw Errors.cannotDisableSelf();
  }
  
  // 不能操作超级管理员
  if (id === 1) {
    throw Errors.cannotModifySuperAdmin();
  }
  
  // 检查管理员是否存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingAdmin) {
    throw Errors.adminNotFound();
  }
  
  // 更新状态
  const admin = await prisma.admin.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      isActive: true,
    },
  });
  
  return admin;
}

/**
 * 重置管理员密码
 * @description 依据：02.4-后台API接口清单.md 第14.1.6节
 * 核心规则：不能重置超级管理员密码（除非是超级管理员自己）
 */
export async function resetAdminPassword(id: number, newPassword: string, operatorId: number) {
  // 不能重置超级管理员密码（除非是超级管理员自己）
  if (id === 1 && operatorId !== 1) {
    throw Errors.cannotModifySuperAdmin();
  }
  
  // 检查管理员是否存在
  const existingAdmin = await prisma.admin.findUnique({
    where: { id },
  });
  
  if (!existingAdmin) {
    throw Errors.adminNotFound();
  }
  
  // 密码哈希
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // 更新密码
  await prisma.admin.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

// ================================
// 黑名单服务
// ================================

/**
 * 获取黑名单列表
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export async function getBlacklistList(params: BlacklistListParams) {
  const { page, pageSize, type, keyword, createdBy, startDate, endDate, sortField, sortOrder } = params;
  
  // 构建查询条件
  const where: Prisma.BlacklistWhereInput = {
    type,
  };
  
  if (keyword) {
    where.value = { contains: keyword };
  }
  
  if (createdBy) {
    where.createdBy = createdBy;
  }
  
  // 创建时间范围筛选
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  // 构建排序（使用函数封装以正确处理类型）
  const buildBlacklistOrderBy = (): Prisma.BlacklistOrderByWithRelationInput => {
    if (sortField && sortOrder) {
      const direction = sortOrder === 'ascend' ? 'asc' : 'desc';
      switch (sortField) {
        case 'id': return { id: direction };
        case 'type': return { type: direction };
        case 'value': return { value: direction };
        case 'createdAt': return { createdAt: direction };
        default: return { createdAt: 'desc' };
      }
    }
    return { createdAt: 'desc' }; // 默认按创建时间降序
  };
  const orderBy = buildBlacklistOrderBy();
  
  // 查询数据
  const [total, list] = await Promise.all([
    prisma.blacklist.count({ where }),
    prisma.blacklist.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
  ]);
  
  // 获取操作人信息
  const creatorIds = [...new Set(list.map((item) => item.createdBy))];
  const creators = await prisma.admin.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, username: true, nickname: true },
  });
  const creatorMap = new Map(creators.map((c) => [c.id, c.nickname || c.username]));
  
  // 如果是银行卡黑名单，尝试获取银行名称
  let bankNameMap = new Map<string, string | null>();
  if (type === 'BANK_CARD') {
    const cardNumbers = list.map((item) => item.value);
    const bankCards = await prisma.bankCard.findMany({
      where: { accountNoMask: { in: cardNumbers.map((v) => `****${v.slice(-4)}`) } },
      select: { accountNoMask: true, bankName: true },
    });
    bankNameMap = new Map(bankCards.map((c) => [c.accountNoMask, c.bankName]));
  }
  
  // 组装结果
  const resultList = list.map((item) => ({
    id: item.id,
    type: item.type,
    value: item.value,
    reason: item.reason,
    bankName: type === 'BANK_CARD' ? bankNameMap.get(`****${item.value.slice(-4)}`) || null : null,
    createdBy: item.createdBy,
    createdByName: creatorMap.get(item.createdBy) || 'Unknown',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
  
  return {
    list: resultList,
    pagination: {
      page,
      pageSize,
      total,
    },
  };
}

/**
 * 添加黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export async function addBlacklist(params: AddBlacklistParams) {
  const { type, value, reason, createdBy } = params;
  
  // 检查是否已存在
  const existing = await prisma.blacklist.findUnique({
    where: {
      type_value: {
        type,
        value,
      },
    },
  });
  
  if (existing) {
    throw Errors.blacklistExists();
  }
  
  // 添加黑名单
  const blacklist = await prisma.blacklist.create({
    data: {
      type,
      value,
      reason: reason || null,
      createdBy,
    },
  });
  
  // 获取操作人信息
  const creator = await prisma.admin.findUnique({
    where: { id: createdBy },
    select: { nickname: true, username: true },
  });
  
  return {
    id: blacklist.id,
    type: blacklist.type,
    value: blacklist.value,
    reason: blacklist.reason,
    createdBy: blacklist.createdBy,
    createdByName: creator?.nickname || creator?.username || 'Unknown',
    createdAt: blacklist.createdAt.toISOString(),
  };
}

/**
 * 删除黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export async function deleteBlacklist(id: number) {
  // 检查是否存在
  const existing = await prisma.blacklist.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw Errors.blacklistNotFound();
  }
  
  // 删除黑名单
  await prisma.blacklist.delete({
    where: { id },
  });
}

/**
 * 批量删除黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export async function batchDeleteBlacklist(ids: number[]) {
  const results: { id: number; success: boolean; error?: { code: string; message: string } }[] = [];
  
  for (const id of ids) {
    try {
      const existing = await prisma.blacklist.findUnique({
        where: { id },
      });
      
      if (!existing) {
        results.push({
          id,
          success: false,
          error: { code: 'BLACKLIST_NOT_FOUND', message: '记录不存在' },
        });
        continue;
      }
      
      await prisma.blacklist.delete({
        where: { id },
      });
      
      results.push({ id, success: true });
    } catch {
      results.push({
        id,
        success: false,
        error: { code: 'DELETE_FAILED', message: '删除失败' },
      });
    }
  }
  
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  
  return {
    total: ids.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * 批量导入黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export async function batchImportBlacklist(params: BatchImportBlacklistParams) {
  const { type, values, reason, createdBy } = params;
  
  const results: { value: string; success: boolean; error?: { code: string; message: string } }[] = [];
  
  for (const value of values) {
    try {
      // 检查是否已存在
      const existing = await prisma.blacklist.findUnique({
        where: {
          type_value: {
            type,
            value,
          },
        },
      });
      
      if (existing) {
        results.push({
          value,
          success: false,
          error: { code: 'BLACKLIST_EXISTS', message: '已在黑名单中' },
        });
        continue;
      }
      
      // 添加黑名单
      await prisma.blacklist.create({
        data: {
          type,
          value,
          reason: reason || null,
          createdBy,
        },
      });
      
      results.push({ value, success: true });
    } catch {
      results.push({
        value,
        success: false,
        error: { code: 'IMPORT_FAILED', message: '导入失败' },
      });
    }
  }
  
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  
  return {
    total: values.length,
    succeeded,
    failed,
    results,
  };
}

// ================================
// 敏感词服务
// ================================

/**
 * 获取敏感词列表
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function getSensitiveWordList(params: SensitiveWordListParams) {
  const { page, pageSize, keyword, category, isActive, severity, startDate, endDate, sortField, sortOrder } = params;
  
  // 构建查询条件
  const where: Prisma.SensitiveWordWhereInput = {};
  
  if (keyword) {
    where.word = { contains: keyword };
  }
  
  if (category) {
    where.category = category;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  if (severity) {
    where.severity = severity;
  }
  
  // 创建时间范围筛选
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  // 构建排序（使用函数封装以正确处理类型）
  const buildSensitiveWordOrderBy = (): Prisma.SensitiveWordOrderByWithRelationInput => {
    if (sortField && sortOrder) {
      const direction = sortOrder === 'ascend' ? 'asc' : 'desc';
      switch (sortField) {
        case 'id': return { id: direction };
        case 'word': return { word: direction };
        case 'category': return { category: direction };
        case 'severity': return { severity: direction };
        case 'createdAt': return { createdAt: direction };
        default: return { createdAt: 'desc' };
      }
    }
    return { createdAt: 'desc' }; // 默认按创建时间降序
  };
  const orderBy = buildSensitiveWordOrderBy();
  
  // 查询数据
  const [total, list] = await Promise.all([
    prisma.sensitiveWord.count({ where }),
    prisma.sensitiveWord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
  ]);
  
  // 获取创建人信息
  const creatorIds = [...new Set(list.filter((item) => item.createdBy).map((item) => item.createdBy as number))];
  const creators = creatorIds.length > 0
    ? await prisma.admin.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, username: true, nickname: true },
      })
    : [];
  const creatorMap = new Map(creators.map((c) => [c.id, c.nickname || c.username]));
  
  // 组装结果
  const resultList = list.map((item) => ({
    id: item.id,
    word: item.word,
    category: item.category,
    severity: item.severity,
    isActive: item.isActive,
    createdBy: item.createdBy,
    creatorName: item.createdBy ? creatorMap.get(item.createdBy) || null : null,
    createdAt: item.createdAt.toISOString(),
  }));
  
  return {
    list: resultList,
    pagination: {
      page,
      pageSize,
      total,
    },
  };
}

/**
 * 添加敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function addSensitiveWord(params: AddSensitiveWordParams) {
  const { word, category, severity = 1, createdBy } = params;
  
  // 检查是否已存在
  const existing = await prisma.sensitiveWord.findUnique({
    where: { word },
  });
  
  if (existing) {
    throw new BusinessError('SENSITIVE_WORD_EXISTS', '该敏感词已存在', 400);
  }
  
  // 添加敏感词
  const sensitiveWord = await prisma.sensitiveWord.create({
    data: {
      word,
      category: category || null,
      severity,
      isActive: true,
      createdBy,
    },
  });
  
  return {
    id: sensitiveWord.id,
    word: sensitiveWord.word,
    category: sensitiveWord.category,
    severity: sensitiveWord.severity,
    isActive: sensitiveWord.isActive,
    createdAt: sensitiveWord.createdAt.toISOString(),
  };
}

/**
 * 批量导入敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function batchImportSensitiveWords(params: BatchImportSensitiveWordsParams) {
  const { words, category, severity = 1, createdBy } = params;
  
  // 去重
  const uniqueWords = [...new Set(words)];
  
  // 查找已存在的敏感词
  const existingWords = await prisma.sensitiveWord.findMany({
    where: { word: { in: uniqueWords } },
    select: { word: true },
  });
  const existingSet = new Set(existingWords.map((w) => w.word));
  
  // 过滤出新词
  const newWords = uniqueWords.filter((w) => !existingSet.has(w));
  const skippedWords = uniqueWords.filter((w) => existingSet.has(w));
  
  // 批量插入新词
  if (newWords.length > 0) {
    await prisma.sensitiveWord.createMany({
      data: newWords.map((word) => ({
        word,
        category: category || null,
        severity,
        isActive: true,
        createdBy,
      })),
    });
  }
  
  return {
    total: uniqueWords.length,
    added: newWords.length,
    skipped: skippedWords.length,
    skippedWords,
  };
}

/**
 * 删除敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function deleteSensitiveWord(id: number) {
  // 检查是否存在
  const existing = await prisma.sensitiveWord.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new BusinessError('SENSITIVE_WORD_NOT_FOUND', '敏感词不存在', 404);
  }
  
  // 删除敏感词
  await prisma.sensitiveWord.delete({
    where: { id },
  });
}

/**
 * 批量删除敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function batchDeleteSensitiveWords(ids: number[]) {
  const result = await prisma.sensitiveWord.deleteMany({
    where: { id: { in: ids } },
  });
  
  return {
    deleted: result.count,
  };
}

/**
 * 启用/禁用敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function toggleSensitiveWordStatus(id: number, isActive: boolean) {
  // 检查是否存在
  const existing = await prisma.sensitiveWord.findUnique({
    where: { id },
  });
  
  if (!existing) {
    throw new BusinessError('SENSITIVE_WORD_NOT_FOUND', '敏感词不存在', 404);
  }
  
  // 更新状态
  await prisma.sensitiveWord.update({
    where: { id },
    data: { isActive },
  });
}
