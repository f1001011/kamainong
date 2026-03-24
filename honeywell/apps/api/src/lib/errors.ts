/**
 * @file 业务错误定义
 * @description 统一的业务错误类和错误码定义
 * @depends 开发文档/02-数据层/02.2-API规范.md 第4节 - 错误码规范
 *
 * 语言规范：
 * - 前端用户API错误消息：阿拉伯语
 * - 后台管理API错误消息：中文
 */

/**
 * 业务错误类
 * @description 用于抛出业务异常，包含错误码、消息和 HTTP 状态码
 */
export class BusinessError extends Error {
  /** 错误码 */
  code: string;
  /** HTTP 状态码 */
  httpStatus: number;
  /** 附加数据 */
  extra?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    httpStatus: number = 400,
    extra?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.extra = extra;
    this.name = 'BusinessError';
  }
}

/**
 * 常用错误快捷创建
 * @description 依据：02.2-API规范.md 第4节 - 错误码规范
 * 前端用户错误消息使用阿拉伯语
 */
export const Errors = {
  // ================================
  // 4.1 通用错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 未登录/Token无效 */
  unauthorized: (message?: string) =>
    new BusinessError('UNAUTHORIZED', message || 'يرجى تسجيل الدخول', 401),

  /** 无权限 */
  forbidden: (message?: string) =>
    new BusinessError('FORBIDDEN', message || 'لا يوجد إذن', 403),

  /** 资源不存在 */
  notFound: (resource: string) =>
    new BusinessError('NOT_FOUND', `${resource} غير موجود`, 404),

  /** 参数校验失败 */
  validationError: (message: string) =>
    new BusinessError('VALIDATION_ERROR', message, 400),

  /** 请求过于频繁 */
  rateLimited: (retryAfter?: number) =>
    new BusinessError('RATE_LIMITED', 'طلبات كثيرة جداً، حاول لاحقاً', 429, {
      retryAfter,
    }),

  /** 服务器内部错误 */
  internalError: (message?: string) =>
    new BusinessError('INTERNAL_ERROR', message || 'خطأ في الخادم', 500),

  // ================================
  // 4.2 资源不存在错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 用户不存在 */
  userNotFound: () => new BusinessError('USER_NOT_FOUND', 'المستخدم غير موجود', 404),

  /** 产品不存在 */
  productNotFound: () =>
    new BusinessError('PRODUCT_NOT_FOUND', 'المنتج غير موجود', 404),

  /** 订单不存在 */
  orderNotFound: () => new BusinessError('ORDER_NOT_FOUND', 'الطلب غير موجود', 404),

  /** 银行卡不存在 */
  bankCardNotFound: () =>
    new BusinessError('BANK_CARD_NOT_FOUND', 'البطاقة البنكية غير موجودة', 404),

  /** 活动不存在 */
  activityNotFound: () =>
    new BusinessError('ACTIVITY_NOT_FOUND', 'النشاط غير موجود', 404),

  /** 公告不存在 */
  announcementNotFound: () =>
    new BusinessError('ANNOUNCEMENT_NOT_FOUND', 'الإعلان غير موجود', 404),

  /** 通知不存在 */
  notificationNotFound: () =>
    new BusinessError('NOTIFICATION_NOT_FOUND', 'الإشعار غير موجود', 404),

  /** 页面内容不存在 */
  pageNotFound: () =>
    new BusinessError('PAGE_NOT_FOUND', 'محتوى الصفحة غير موجود', 404),

  // ================================
  // 4.3 用户相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 手机号已注册 */
  phoneAlreadyExists: () =>
    new BusinessError('PHONE_ALREADY_EXISTS', 'هذا الرقم مسجل بالفعل', 400),

  /** 同IP注册数已达上限 */
  registerIpLimit: () =>
    new BusinessError('REGISTER_IP_LIMIT', 'تم الوصول إلى الحد الأقصى للتسجيلات من هذا العنوان', 400),

  /** 账号或密码错误 */
  invalidCredentials: () =>
    new BusinessError('INVALID_CREDENTIALS', 'الحساب أو كلمة المرور غير صحيحة', 400),

  /** 旧密码错误 */
  oldPasswordWrong: () =>
    new BusinessError('OLD_PASSWORD_WRONG', 'كلمة المرور السابقة غير صحيحة', 400),

  /** 新密码与旧密码相同 */
  samePassword: () =>
    new BusinessError('SAME_PASSWORD', 'لا يمكن أن تكون كلمة المرور الجديدة مماثلة للقديمة', 400),

  /** 邀请码无效 */
  invalidInviteCode: () =>
    new BusinessError('INVALID_INVITE_CODE', 'رمز الدعوة غير صالح', 400),

  /** 账号已被封禁 */
  userBanned: () => new BusinessError('USER_BANNED', 'الحساب محظور', 403),

  /** 包含敏感词 */
  sensitiveWordDetected: () =>
    new BusinessError('SENSITIVE_WORD_DETECTED', 'يحتوي على كلمات محظورة', 400),

  // ================================
  // 4.4 余额相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 余额不足 */
  insufficientBalance: () =>
    new BusinessError('INSUFFICIENT_BALANCE', 'رصيد غير كافٍ', 400),

  // ================================
  // 4.5 产品购买相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 已购买过该产品 */
  alreadyPurchased: () =>
    new BusinessError('ALREADY_PURCHASED', 'لقد اشتريت هذا المنتج بالفعل', 400),

  /** 产品已下架 */
  productInactive: () =>
    new BusinessError('PRODUCT_INACTIVE', 'المنتج غير متاح', 400),

  /** 已达产品限购数量 */
  productLimitExceeded: () =>
    new BusinessError('PRODUCT_LIMIT_EXCEEDED', 'تم الوصول إلى حد الشراء', 400),

  /** VIP等级不足（保留向后兼容） */
  vipLevelRequired: (level: number) =>
    new BusinessError('VIP_LEVEL_REQUIRED', `يتطلب مستوى VIP${level}`, 400),

  /** 个人限购已满 */
  personalLimitExceeded: () =>
    new BusinessError('PERSONAL_LIMIT_EXCEEDED', 'تم الوصول إلى حد الشراء الشخصي', 400),

  /** 全局库存不足 */
  globalStockExhausted: () =>
    new BusinessError('GLOBAL_STOCK_EXHAUSTED', 'المنتج نفد', 400),

  /** 产品即将推出 */
  productComingSoon: () =>
    new BusinessError('PRODUCT_COMING_SOON', 'المنتج سيتوفر قريباً', 400),

  /** 未完成充值（提现条件） */
  notRecharged: () =>
    new BusinessError('NOT_RECHARGED', 'يجب الإيداع أولاً لتتمكن من السحب', 400),

  /** 未购买付费产品（提现条件） */
  notPurchasedPaid: () =>
    new BusinessError('NOT_PURCHASED_PAID', 'يجب شراء منتج لتتمكن من السحب', 400),

  /** 本周已领取周薪 */
  alreadyClaimedThisWeek: () =>
    new BusinessError('ALREADY_CLAIMED_THIS_WEEK', 'تمت المطالبة هذا الأسبوع بالفعل', 400),

  /** 未达到任何周薪档位 */
  noTierMatched: () =>
    new BusinessError('NO_TIER_MATCHED', 'لم تصل إلى أي مستوى مكافأة', 400),

  /** 今日奖池余额不足 */
  poolInsufficient: () =>
    new BusinessError('POOL_INSUFFICIENT', 'صندوق الجوائز نفد اليوم', 400),

  /** 有效邀请人数不足 */
  invitesNotEnough: () =>
    new BusinessError('INVITES_NOT_ENOUGH', 'عدد الدعوات الصالحة غير كافٍ', 400),

  /** 今日已领取该档位 */
  alreadyClaimedToday: () =>
    new BusinessError('ALREADY_CLAIMED_TODAY', 'تمت المطالبة اليوم بالفعل', 400),

  /** 无可用抽奖次数 */
  noChances: () =>
    new BusinessError('NO_CHANCES', 'لا توجد فرص دوران متاحة', 400),

  /** 转盘活动未开启 */
  spinDisabled: () =>
    new BusinessError('SPIN_DISABLED', 'العجلة غير متاحة', 400),

  /** 无效的提现订单 */
  invalidWithdrawOrder: () =>
    new BusinessError('INVALID_WITHDRAW_ORDER', 'طلب سحب غير صالح', 400),

  /** 该订单已发过帖子 */
  postAlreadyExists: () =>
    new BusinessError('POST_ALREADY_EXISTS', 'تم النشر لهذا الطلب بالفعل', 400),

  // ================================
  // 4.6 提现相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 提现门槛未满足 */
  withdrawThresholdNotMet: () =>
    new BusinessError('WITHDRAW_THRESHOLD_NOT_MET', 'لم تستوفِ متطلبات السحب', 400),

  /** 非提现时间段 */
  withdrawTimeInvalid: () =>
    new BusinessError('WITHDRAW_TIME_INVALID', 'خارج أوقات السحب', 400),

  /** 超出每日提现次数 */
  withdrawLimitExceeded: () =>
    new BusinessError('WITHDRAW_LIMIT_EXCEEDED', 'تم الوصول إلى حد السحب اليومي', 400),

  /** 提现金额不在范围内 */
  withdrawAmountInvalid: () =>
    new BusinessError('WITHDRAW_AMOUNT_INVALID', 'مبلغ السحب خارج النطاق المسموح', 400),

  // ================================
  // 4.7 充值相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 充值金额不在范围内 */
  rechargeAmountInvalid: () =>
    new BusinessError('RECHARGE_AMOUNT_INVALID', 'مبلغ الإيداع خارج النطاق المسموح', 400),

  /** 待支付订单数已达上限 */
  pendingOrderLimit: (limit?: number) =>
    new BusinessError(
      'PENDING_ORDER_LIMIT',
      limit ? `تم الوصول إلى حد الطلبات المعلقة (${limit})` : 'تم الوصول إلى حد الطلبات المعلقة',
      400
    ),

  // ================================
  // 4.8 银行卡相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 需先绑定银行卡 */
  bankCardRequired: () =>
    new BusinessError('BANK_CARD_REQUIRED', 'يرجى ربط بطاقة بنكية أولاً', 400),

  /** 银行卡有进行中的提现 */
  bankCardInUse: () =>
    new BusinessError('BANK_CARD_IN_USE', 'البطاقة لديها عملية سحب قيد المعالجة', 400),

  /** 银行卡数量已达上限 */
  bankCardLimitExceeded: () =>
    new BusinessError('BANK_CARD_LIMIT_EXCEEDED', 'تم الوصول إلى حد البطاقات البنكية', 400),

  /** 最后一张银行卡不可删除 */
  bankCardLastOne: () =>
    new BusinessError('BANK_CARD_LAST_ONE', 'لا يمكن حذف البطاقة الأخيرة', 400),

  /** 该银行暂不支持 */
  bankDisabled: () =>
    new BusinessError('BANK_DISABLED', 'هذا البنك غير متاح حالياً', 400),

  /** 银行不存在 */
  bankNotFound: () => new BusinessError('BANK_NOT_FOUND', 'البنك غير موجود', 404),

  /** 银行编码已存在 */
  bankCodeExists: () =>
    new BusinessError('BANK_CODE_EXISTS', 'رمز البنك موجود بالفعل', 400),

  /** 银行编码格式无效 */
  bankCodeInvalid: () =>
    new BusinessError('BANK_CODE_INVALID', 'صيغة رمز البنك غير صالحة', 400),

  /** 银行有关联的银行卡，无法删除 */
  bankHasCards: () =>
    new BusinessError('BANK_HAS_CARDS', 'البنك لديه بطاقات مرتبطة، لا يمكن حذفه', 400),

  /** 银行账户已被其他手机号锁定 */
  accountPhoneLocked: () =>
    new BusinessError('ACCOUNT_PHONE_LOCKED', 'هذا الحساب البنكي مرتبط برقم هاتف آخر', 400),

  // ================================
  // 4.9 签到相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 今日已签到 */
  alreadySignedToday: () =>
    new BusinessError('ALREADY_SIGNED_TODAY', 'لقد سجلت حضورك اليوم بالفعل', 400),

  /** 签到窗口期已过期 */
  signinWindowExpired: () =>
    new BusinessError('SIGNIN_WINDOW_EXPIRED', 'انتهت فترة تسجيل الحضور', 400),

  /** 签到任务已完成 */
  signinCompleted: () =>
    new BusinessError('SIGNIN_COMPLETED', 'اكتملت مهمة تسجيل الحضور', 400),

  /** SVIP奖励已领取 */
  svipAlreadyClaimed: () =>
    new BusinessError('SVIP_ALREADY_CLAIMED', 'تمت المطالبة بمكافأة SVIP اليوم بالفعل', 400),

  /** 未达到任何SVIP资格 */
  svipNotQualified: () =>
    new BusinessError('SVIP_NOT_QUALIFIED', 'لم تستوفِ شروط مكافأة SVIP', 400),

  /** SVIP奖励功能已关闭 */
  svipDisabled: () =>
    new BusinessError('SVIP_DISABLED', 'مكافأة SVIP غير متاحة حالياً', 400),

  // ================================
  // 4.10 活动奖励相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 奖励已领取 */
  rewardAlreadyClaimed: () =>
    new BusinessError('REWARD_ALREADY_CLAIMED', 'تمت المطالبة بالمكافأة بالفعل', 400),

  /** 未达领取条件 */
  rewardNotAvailable: () =>
    new BusinessError('REWARD_NOT_AVAILABLE', 'لم تستوفِ شروط المطالبة', 400),

  /** 活动已关闭 */
  activityNotActive: () =>
    new BusinessError('ACTIVITY_NOT_ACTIVE', 'النشاط مغلق', 400),

  /** 前置条件未达成（连单奖励专用） */
  prerequisiteNotMet: () =>
    new BusinessError('PREREQUISITE_NOT_MET', 'المتطلبات المسبقة غير مستوفاة', 400),

  /** 被邀请人未完成任务 */
  inviteeTaskIncomplete: () =>
    new BusinessError('INVITEE_TASK_INCOMPLETE', 'المدعو لم يكمل المهمة', 400),

  // ================================
  // 4.11 订单相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 订单状态不允许此操作 */
  orderStatusInvalid: () =>
    new BusinessError('ORDER_STATUS_INVALID', 'حالة الطلب لا تسمح بهذه العملية', 400),

  /** 订单已过期/超时 */
  orderExpired: () => new BusinessError('ORDER_EXPIRED', 'الطلب منتهي الصلاحية', 400),

  // ================================
  // 4.12 支付通道相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 无可用支付通道 */
  noAvailableChannel: () =>
    new BusinessError('NO_AVAILABLE_CHANNEL', 'لا توجد قنوات دفع متاحة', 503),

  /** 支付通道不可用 */
  channelUnavailable: () =>
    new BusinessError('CHANNEL_UNAVAILABLE', 'قناة الدفع غير متاحة', 503),

  /** 支付通道返回异常 */
  channelError: (message?: string) =>
    new BusinessError('CHANNEL_ERROR', message || 'خطأ في قناة الدفع', 502),

  // ================================
  // 4.13 黑名单相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 手机号已被拉黑 */
  blacklistPhone: () =>
    new BusinessError('BLACKLIST_PHONE', 'رقم الهاتف محظور', 403),

  /** IP地址已被拉黑 */
  blacklistIp: () => new BusinessError('BLACKLIST_IP', 'عنوان IP محظور', 403),

  /** 银行卡号已被拉黑 */
  blacklistBankCard: () =>
    new BusinessError('BLACKLIST_BANK_CARD', 'البطاقة البنكية محظورة', 403),

  // ================================
  // 4.14 后台管理端错误码（中文 - 仅后台使用）
  // ================================

  /** 管理员账号或密码错误 */
  adminInvalidCredentials: () =>
    new BusinessError('ADMIN_INVALID_CREDENTIALS', '管理员账号或密码错误', 400),

  /** 管理员账号已禁用 */
  adminDisabled: () =>
    new BusinessError('ADMIN_DISABLED', '管理员账号已禁用', 403),

  /** 管理员不存在 */
  adminNotFound: () =>
    new BusinessError('ADMIN_NOT_FOUND', '管理员不存在', 404),

  /** 管理员用户名已存在 */
  adminUsernameExists: () =>
    new BusinessError('ADMIN_USERNAME_EXISTS', '管理员用户名已存在', 400),

  /** 不能禁用自己的账号 */
  cannotDisableSelf: () =>
    new BusinessError('CANNOT_DISABLE_SELF', '不能禁用自己的账号', 400),

  /** 不能删除自己的账号 */
  cannotDeleteSelf: () =>
    new BusinessError('CANNOT_DELETE_SELF', '不能删除自己的账号', 400),

  /** 不能修改超级管理员 */
  cannotModifySuperAdmin: () =>
    new BusinessError('CANNOT_MODIFY_SUPER_ADMIN', '不能修改超级管理员', 403),

  /** 不能删除超级管理员 */
  cannotDeleteSuperAdmin: () =>
    new BusinessError('CANNOT_DELETE_SUPER_ADMIN', '不能删除超级管理员', 403),

  /** 黑名单记录已存在 */
  blacklistExists: () =>
    new BusinessError('BLACKLIST_EXISTS', '黑名单记录已存在', 400),

  /** 黑名单记录不存在 */
  blacklistNotFound: () =>
    new BusinessError('BLACKLIST_NOT_FOUND', '黑名单记录不存在', 404),

  /** 订单不存在（后台） */
  adminOrderNotFound: () =>
    new BusinessError('ORDER_NOT_FOUND', '订单不存在', 404),

  /** 订单状态不允许此操作（后台） */
  adminOrderStatusInvalid: () =>
    new BusinessError('ORDER_STATUS_INVALID', '订单状态不允许此操作', 400),

  /** 用户不存在（后台） */
  adminUserNotFound: () =>
    new BusinessError('USER_NOT_FOUND', '用户不存在', 404),

  /** 产品不存在（后台） */
  adminProductNotFound: () =>
    new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404),

  /** 无可用支付通道（后台） */
  adminNoAvailableChannel: () =>
    new BusinessError('NO_AVAILABLE_CHANNEL', '无可用支付通道', 503),

  /** 支付通道错误（后台） */
  adminChannelError: (message?: string) =>
    new BusinessError('CHANNEL_ERROR', message || '支付通道返回异常', 502),

  // ================================
  // 4.15 系统错误码（内部日志用，用户不可见）
  // ================================

  /** 收益发放失败 */
  incomeSettleFailed: () =>
    new BusinessError('INCOME_SETTLE_FAILED', 'خطأ في توزيع الأرباح', 500),

  /** 配置错误 - 必需的配置项未配置（内部错误） */
  configMissing: (configKey: string) =>
    new BusinessError('CONFIG_MISSING', `خطأ في الإعدادات: ${configKey}`, 500),

  /** 配置错误 - 站点域名未配置（内部错误） */
  siteDomainNotConfigured: () =>
    new BusinessError('CONFIG_ERROR', 'خطأ في إعدادات الموقع', 500),

  // ================================
  // 4.16 礼品码相关错误码（前端用户 - 阿拉伯语）
  // ================================

  /** 礼品码不存在 */
  giftCodeNotFound: () =>
    new BusinessError('GIFT_CODE_NOT_FOUND', 'رمز الهدية غير موجود', 400),

  /** 礼品码已失效/禁用 */
  giftCodeDisabled: () =>
    new BusinessError('GIFT_CODE_DISABLED', 'رمز الهدية غير متاح', 400),

  /** 礼品码已过期 */
  giftCodeExpired: () =>
    new BusinessError('GIFT_CODE_EXPIRED', 'رمز الهدية منتهي الصلاحية', 400),

  /** 礼品码尚未生效 */
  giftCodeNotStarted: () =>
    new BusinessError('GIFT_CODE_NOT_STARTED', 'رمز الهدية لم يبدأ بعد', 400),

  /** 礼品码已领完 */
  giftCodeExhausted: () =>
    new BusinessError('GIFT_CODE_EXHAUSTED', 'رمز الهدية نفد', 400),

  /** 已兑换过该礼品码 */
  giftCodeAlreadyClaimed: () =>
    new BusinessError('GIFT_CODE_ALREADY_CLAIMED', 'لقد استخدمت رمز الهدية هذا بالفعل', 400),

  /** 需先购买产品才能兑换 */
  giftCodeRequirePurchase: () =>
    new BusinessError('GIFT_CODE_REQUIRE_PURCHASE', 'يجب شراء منتج قبل الاستخدام', 400),

  /** 礼品码已有领取记录，无法删除（后台） */
  adminGiftCodeHasClaims: () =>
    new BusinessError('GIFT_CODE_HAS_CLAIMS', '礼品码已有领取记录，无法删除', 400),

  // ================================
  // 其他业务错误（兼容保留）
  // ================================

  /** 参数无效（兼容旧代码） */
  invalidParams: (message: string) =>
    new BusinessError('VALIDATION_ERROR', message, 400),
};
