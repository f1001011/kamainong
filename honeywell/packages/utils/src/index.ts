/**
 * @file 共享工具函数模块入口
 * @description 导出所有共享工具函数，供 API、Admin、Web 等服务使用
 * @depends 开发文档/05-服务架构/05.1-服务架构.md 第2.1节 - packages/utils 结构
 * 
 * 模块清单：
 * - crypto: 加密/解密/脱敏工具
 * - format: 货币/百分比/时间格式化
 * - timezone: 时区处理与转换
 * - order-no: 订单号生成与验证
 * - invite-code: 邀请码生成与验证
 */

/**
 * 加密工具
 * - aesEncrypt: AES 加密（用户密码、银行卡号）
 * - aesDecrypt: AES 解密
 * - bcryptHash: bcrypt 哈希（管理员密码）
 * - bcryptVerify: bcrypt 验证
 * - maskAccountNo: 银行卡号脱敏
 * - maskPhone: 手机号脱敏
 * - maskDocumentNo: 证件号脱敏
 * - maskEmail: 邮箱脱敏
 */
export * from './crypto';

/**
 * 格式化工具
 * - formatCurrency: 货币格式化（推荐）
 * - formatAmount: 货币格式化（别名）
 * - formatSystemTime: 系统时间格式化
 * - formatPercent: 百分比格式化
 * - formatPhone: 手机号格式化
 * - formatDateTime: 日期时间格式化（已废弃，使用 formatSystemTime）
 * - formatDate: 日期格式化（已废弃）
 * - formatTime: 时间格式化（已废弃）
 */
export * from './format';

/**
 * 时区工具
 * - getSystemTimezone: 获取系统配置时区
 * - getSystemTimezoneSync: 同步获取系统时区
 * - setSystemTimezoneCache: 设置时区缓存
 * - clearSystemTimezoneCache: 清除时区缓存
 * - registerTimezoneConfigGetter: 注册时区配置获取器
 * - convertToTimezone: UTC 转指定时区
 * - getNow: 获取当前时间
 * - getTodayStart: 获取今日起始时间
 * - getTodayEnd: 获取今日结束时间
 * - isInTimeRange: 判断是否在时间范围内
 * - isSameDay: 判断是否同一天
 * - isToday: 判断是否今天
 * - isYesterday: 判断是否昨天
 * - daysBetween: 计算天数差
 * - addHours: 添加小时
 * - addDays: 添加天数
 * - addMinutes: 添加分钟
 * - getSystemDateBounds: 获取日期边界
 */
export * from './timezone';

/**
 * 订单号工具
 * - generateOrderNo: 生成订单号
 * - parseOrderNo: 解析订单号
 * - isValidOrderNo: 验证订单号格式
 * - getOrderTypeName: 获取订单类型名称
 * - getOrderDate: 获取订单日期
 */
export * from './order-no';

/**
 * 邀请码工具
 * - generateInviteCode: 生成邀请码
 * - isValidInviteCode: 验证邀请码格式
 * - extractInviteCode: 从链接提取邀请码
 * - generateInviteLink: 生成邀请链接
 */
export * from './invite-code';
