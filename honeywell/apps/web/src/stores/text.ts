/**
 * @file 文案配置 Store
 * @description 管理前端所有文案配置（支持后台动态修改）
 * @reference 开发文档/03.0-前端架构.md
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TextConfig } from '@/types';

/**
 * 文案 Store 状态
 */
interface TextState {
  /** 文案配置 */
  texts: TextConfig;
  /** 配置版本号 */
  version: number;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 设置文案 */
  setTexts: (texts: TextConfig) => void;
  /** 设置版本号 */
  setVersion: (version: number) => void;
  /** 设置加载状态 */
  setLoaded: (loaded: boolean) => void;
  /** 获取单个文案 */
  getText: (key: string, defaultValue?: string) => string;
  /** 重置 */
  reset: () => void;
}

/**
 * 默认文案配置
 * @description 阿拉伯语默认值，用于配置加载前
 * 依据：开发规范.md 第2.7节 - 用户前端文案默认值使用阿拉伯语
 */
const defaultTexts: TextConfig = {
  // 通用按钮
  'btn.confirm': 'تأكيد',
  'btn.cancel': 'إلغاء',
  'btn.submit': 'إرسال',
  'btn.close': 'إغلاق',
  'btn.back': 'رجوع',
  'btn.next': 'التالي',
  'btn.save': 'حفظ',
  'btn.delete': 'حذف',
  'btn.edit': 'تعديل',
  'btn.retry': 'إعادة المحاولة',
  'btn.loading': 'جارٍ التحميل...',
  'btn.recharge': 'إيداع',
  'btn.withdraw': 'سحب',
  'btn.buy': 'شراء',
  'btn.login': 'تسجيل الدخول',
  'btn.login_to_buy': 'تسجيل الدخول',
  'btn.logging_in': 'جارٍ الدخول...',
  'btn.register': 'تسجيل حساب',
  'btn.registering': 'جارٍ التسجيل...',
  'btn.logout': 'تسجيل الخروج',
  'btn.refresh': 'تحديث',
  'btn.load_more': 'تحميل المزيد',
  'btn.processing': 'جارٍ المعالجة...',
  'btn.purchasing': 'جارٍ المعالجة...',
  'btn.submitting': 'جارٍ المعالجة...',
  'btn.adding': 'جارٍ الإضافة...',
  'btn.confirm_purchase': 'تأكيد الشراء',
  'btn.buy_now': 'اشترِ الآن',
  'btn.bought': 'تم الشراء',
  'btn.vip_required': 'يتطلب VIP',
  'btn.insufficient_balance': 'رصيد غير كافٍ',
  'btn.view_products': 'عرض المنتجات',
  'btn.view_record': 'عرض السجل',
  'btn.view_recharge_history': 'عرض سجل الإيداعات',
  'btn.add_card': 'إضافة بطاقة',
  'btn.add_new_card': 'إضافة بطاقة جديدة',
  'btn.bind_card': 'إضافة بطاقة',
  'btn.cancel_order': 'إلغاء الطلب',
  'btn.continue_pay': 'متابعة الدفع',
  'btn.copy': 'نسخ',
  'btn.change_password': 'تغيير كلمة المرور',
  'btn.clear_filter': 'مسح التصفية',
  'btn.back_to_list': 'العودة للقائمة',
  'btn.back_to_positions': 'العودة لاستثماراتي',
  'btn.explore_products': 'استكشاف المنتجات',
  'btn.withdraw_all': 'الكل',
  'btn.participate': 'مشاركة',

  // 页面标题
  'page.transactions': 'المعاملات',
  'page.recharge': 'إيداع',
  'page.withdraw': 'سحب',
  'page.products': 'المنتجات',
  'page.product_detail': 'تفاصيل المنتج',
  'page.my_positions': 'استثماراتي',
  'page.position_detail': 'تفاصيل الاستثمار',
  'page.recharge_record': 'سجل الإيداعات',
  'page.recharge_detail': 'تفاصيل الإيداع',
  'page.withdraw_record': 'سجل السحوبات',
  'page.withdraw_detail': 'تفاصيل السحب',
  'page.bank_cards': 'بطاقاتي',
  'page.add_bank_card': 'إضافة بطاقة',
  'page.security': 'إعدادات الأمان',
  'page.change_password': 'تغيير كلمة المرور',
  'page.about': 'من نحن',
  'page.activities': 'مركز الأنشطة',
  'page.activity_collection': 'مكافأة المجموعة',
  'page.login_title': 'تسجيل الدخول',
  'page.login_subtitle': 'أدخل حسابك للمتابعة',
  'page.register_title': 'إنشاء حساب',
  'page.register_subtitle': 'سجّل للبدء',

  // 标签页筛选（提现记录、充值记录等页面的 Tab）
  'tab.all': 'الكل',
  'tab.pending_payment': 'معلّق',
  'tab.pending_review': 'قيد المراجعة',
  'tab.processing': 'قيد المعالجة',
  'tab.completed': 'مكتمل',
  'tab.rejected': 'مرفوض',
  'tab.failed': 'فشل',
  'tab.cancelled': 'ملغى',
  'tab.active': 'قيد التنفيذ',

  // 交易类型筛选（资金明细页面的类型 Tab）
  'filter.all': 'الكل',
  'filter.select_date': 'اختيار التاريخ',
  'filter.select_date_range': 'اختيار نطاق التاريخ',
  'trans.recharge': 'إيداع',
  'trans.withdraw_freeze': 'سحب مجمّد',
  'trans.withdraw_success': 'سحب ناجح',
  'trans.withdraw_refund': 'استرداد',
  'trans.purchase': 'شراء',
  'trans.income': 'دخل',
  'trans.commission': 'عمولة',
  'trans.sign_in': 'تسجيل حضور',
  'trans.activity': 'نشاط',
  'trans.register': 'تسجيل',
  'trans.admin_add': 'تعديل إيجابي',
  'trans.admin_deduct': 'تعديل سلبي',

  // 日期分组标题（资金明细页面日期分组）
  'date.today': 'اليوم',
  'date.yesterday': 'أمس',
  'date.last_7_days': 'آخر 7 أيام',
  'date.last_30_days': 'آخر 30 يوم',
  'date.this_month': 'هذا الشهر',

  // 导航
  'nav.home': 'الرئيسية',
  'nav.products': 'المنتجات',
  'nav.recharge': 'إيداع',
  'nav.positions': 'استثماراتي',
  'nav.profile': 'الملف الشخصي',
  'nav.activities': 'الأنشطة',
  'nav.messages': 'الرسائل',
  'nav.notifications': 'الإشعارات',
  'nav.support': 'الدعم',

  // 状态
  'status.success': 'نجاح',
  'status.failed': 'فشل',
  'status.pending': 'معلّق',
  'status.processing': 'قيد المعالجة',
  'status.completed': 'مكتمل',
  'status.cancelled': 'ملغى',
  'status.warning': 'تحذير',
  'status.info': 'معلومات',
  'status.copied': 'تم النسخ',
  'status.rejected': 'مرفوض',
  'status.pending_review': 'قيد المراجعة',
  'status.approved': 'قيد المعالجة',
  'status.pending_payment': 'في انتظار الدفع',
  'status.paid': 'ناجح',
  'status.active': 'نشط',

  // 标签
  'tag.new': 'جديد',
  'tag.verified': 'موثّق',
  'tag.popular': 'شائع',
  'tag.new_user': 'موصى به',
  'tag.owned': 'أملكه',
  'tag.vip_required': 'يتطلب VIP {level}',
  'tag.trial': 'تجربة',

  // 关于我们页面
  'about.error': 'تعذر تحميل المعلومات',
  'about.retry': 'إعادة المحاولة',
  'about.version': 'الإصدار',

  // 空状态
  'empty.about': 'المعلومات غير متوفرة',
  'empty.about_tip': 'معلومات الشركة ستكون متاحة قريباً',
  'empty.noData': 'لا توجد بيانات',
  'empty.noProducts': 'لا توجد منتجات متاحة',
  'empty.noProducts_desc': 'لا توجد منتجات متاحة حالياً',
  'empty.noPositions': 'ليس لديك استثمارات بعد',
  'empty.noTransactions': 'لا توجد معاملات',
  'empty.default': 'لا توجد بيانات',
  'empty.default_desc': 'لا توجد بيانات للعرض حالياً',
  'empty.recharge_record': 'لا يوجد سجل إيداعات',
  'empty.recharge_record_desc': 'قم بإجراء إيداع لرؤية السجل هنا',
  'empty.withdraw_record': 'لا يوجد سجل سحوبات',
  'empty.positions': 'ليس لديك استثمارات بعد',
  'empty.positions_guide': 'استكشف منتجاتنا وابدأ بالاستثمار',
  'empty.transactions': 'لا توجد معاملات',
  'empty.transactions_desc': 'ليس لديك سجل معاملات',
  'empty.transactions_filtered': 'لا توجد نتائج',
  'empty.transactions_filtered_tip': 'لم يتم العثور على معاملات بالتصفية المحددة',
  'empty.transactions_tip': 'ليس لديك سجل معاملات بعد',
  'empty.messages': 'لا توجد رسائل',
  'empty.team': 'ليس لديك فريق بعد',
  'empty.team_guide': 'ادعُ أصدقاءك واكسب عمولات',
  'empty.bank_cards': 'لا توجد بطاقات بنكية',
  'empty.search': 'لم يتم العثور على نتائج',
  'empty.search_desc': 'لم يتم العثور على نتائج لبحثك',
  'empty.user': 'لا يوجد مستخدمون',
  'empty.user_desc': 'لا يوجد مستخدمون متاحون',

  // 错误提示
  'error.network': 'خطأ في الاتصال',
  'error.timeout': 'انتهت مهلة الطلب',
  'error.unknown': 'حدث خطأ',
  'error.unauthorized': 'يرجى تسجيل الدخول',
  'error.load_failed': 'خطأ في التحميل',
  'error.load_failed_tip': 'تعذر تحميل البيانات',
  'error.server': 'خطأ في الخادم',
  'error.try_again': 'تعذر التحميل. حاول مرة أخرى.',
  'error.insufficient_balance': 'رصيد غير كافٍ',
  'error.already_purchased': 'لقد اشتريت هذا المنتج بالفعل',
  'error.vip_required': 'مستوى VIP غير كافٍ',
  'error.vip_required_desc': 'يتطلب VIP',
  'error.amount_out_of_range': 'يجب أن يكون المبلغ بين {min} و {max}',
  'error.amount_min': 'الحد الأدنى للمبلغ هو {min}',
  'error.amount_max': 'الحد الأقصى للمبلغ هو {max}',
  'error.select_channel': 'يرجى اختيار قناة الدفع',
  'error.pending_order_limit': 'لديك طلبات معلقة كثيرة جداً',
  'error.phone_required': 'أدخل رقم الهاتف',
  'error.phone_invalid': 'رقم الهاتف غير صالح (9 أرقام)',
  'error.phone_already_exists': 'هذا الرقم مسجل بالفعل',
  'error.invalid_invite_code': 'رمز الدعوة غير صالح',
  'error.register_ip_limit': 'عدد كبير جداً من التسجيلات من هذا العنوان',
  'error.rate_limited': 'محاولات كثيرة جداً. انتظر لحظة.',
  'error.invalid_credentials': 'رقم الهاتف أو كلمة المرور غير صحيحة',
  'error.user_banned': 'تم تعليق حسابك. اتصل بالدعم.',
  'error.login_required': 'يرجى تسجيل الدخول',
  'error.old_password_wrong': 'كلمة المرور الحالية غير صحيحة',
  'error.old_password_required': 'يرجى إدخال كلمة المرور الحالية',
  'error.same_password': 'كلمة المرور الجديدة لا يمكن أن تكون مثل السابقة',
  'error.password_validation': 'كلمة المرور لا تستوفي المتطلبات',
  'error.password_letter': 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل',
  'error.password_number': 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل',
  'error.confirm_password_required': 'يرجى تأكيد كلمة المرور الجديدة',
  'error.password_mismatch': 'كلمات المرور غير متطابقة',
  'error.bank_required': 'اختر بنكاً',
  'error.account_no_required': 'أدخل رقم الحساب',
  'error.account_no_invalid': 'رقم الحساب غير صالح (8-20 رقم)',
  'error.account_name_required': 'أدخل اسم صاحب الحساب',
  'error.account_name_too_short': 'الاسم قصير جداً',
  'error.bank_card_limit': 'لقد بلغت الحد الأقصى للبطاقات',
  'error.add_card_failed': 'خطأ في إضافة البطاقة',
  'error.load_banks_failed': 'خطأ في تحميل البنوك',
  'error.load_cards_failed': 'خطأ في تحميل البطاقات',
  'error.delete_failed': 'خطأ في الحذف',
  'error.claim_failed': 'خطأ في المطالبة',
  'error.product_not_found': 'المنتج غير موجود',
  'error.order_not_found': 'الطلب غير موجود',
  'error.position_not_found': 'الاستثمار غير موجود',

  // Toast 提示
  'toast.network_error': 'خطأ في الشبكة، حاول مرة أخرى',
  'toast.register_success': 'تم التسجيل بنجاح',
  'toast.register_failed': 'خطأ في التسجيل',
  'toast.login_success': 'تم تسجيل الدخول بنجاح',
  'toast.login_failed': 'خطأ في تسجيل الدخول',
  'toast.logout_success': 'تم تسجيل الخروج',
  'toast.redirect_login': 'يرجى تسجيل الدخول مرة أخرى',
  'toast.bank_card_added': 'تمت إضافة البطاقة بنجاح',
  'toast.withdraw_success': 'تم إرسال طلب السحب',
  'toast.claim_success': 'تم المطالبة بالمكافأة',
  'toast.update_success': 'تم التحديث بنجاح',
  'toast.update_failed': 'خطأ في التحديث',
  'toast.password_changed': 'تم تغيير كلمة المرور بنجاح',
  'toast.order_cancelled': 'تم إلغاء الطلب',
  'toast.cancel_failed': 'خطأ في الإلغاء',
  'toast.copy_success': 'تم النسخ بنجاح',
  'toast.copy_failed': 'خطأ في النسخ',
  'toast.card_deleted': 'تم حذف البطاقة',
  'toast.saveSuccess': 'تم الحفظ بنجاح',
  'toast.saveFailed': 'خطأ في الحفظ',
  'toast.downloadSuccess': 'تم التنزيل بنجاح',
  'toast.copyFailed': 'خطأ في النسخ',

  // 时间
  'time.today': 'اليوم',
  'time.yesterday': 'أمس',
  'time.days': 'أيام',
  'time.oneDay': 'يوم واحد',
  'time.justNow': 'الآن',
  'time.minutesAgo': 'د',
  'time.hoursAgo': 'س',
  'time.daysAgo': 'ي',

  // 余额
  'balance.available': 'الرصيد المتاح',
  'balance.frozen': 'الرصيد المجمّد',
  'balance.total': 'الرصيد الإجمالي',
  'balance.current': 'الرصيد الحالي',
  'balance.deduct': 'خصم',
  'balance.after': 'الرصيد بعد',

  // 充值提现
  'recharge.title': 'إيداع',
  'recharge.amount': 'مبلغ الإيداع',
  'withdraw.title': 'سحب',
  'withdraw.amount': 'مبلغ السحب',
  'withdraw.fee': 'عمولة',
  'withdraw.actualAmount': 'المبلغ المستلم',

  // 标签与表单字段
  'label.secure': 'آمن',
  'label.amount': 'المبلغ',
  'label.custom_amount': 'مبلغ مخصص',
  'label.available_balance': 'الرصيد المتاح',
  'label.frozen_balance': 'الرصيد المجمّد',
  'label.bank': 'البنك',
  'label.account_no': 'رقم الحساب',
  'label.account_name': 'اسم صاحب الحساب',
  'label.phone': 'الهاتف',
  'label.document_type': 'نوع الوثيقة',
  'label.document_no': 'رقم الوثيقة',
  'label.account_type': 'نوع الحساب',
  'label.cci_code': 'رمز CCI',
  'label.card_holder': 'صاحب الحساب',
  'label.order_no': 'رقم الطلب',
  'label.select_channel': 'اختيار القناة',
  'label.available': 'متاح',
  'label.old_password': 'كلمة المرور الحالية',
  'label.new_password': 'كلمة المرور الجديدة',
  'label.confirm_password': 'تأكيد كلمة المرور',
  'label.invite_code': 'رمز الدعوة',
  'label.new_user': 'جديد',
  'label.balance_after': 'الرصيد بعد',
  'label.related_order': 'طلب مرتبط',
  'label.remark': 'ملاحظة',
  'label.or': 'أو',
  'label.optional': 'اختياري',
  'label.custom_range': 'نطاق مخصص',
  'label.bound_cards': 'البطاقات المرتبطة',
  'label.total_records': 'الإجمالي',
  'label.days': 'أيام',
  'label.days_remaining': 'أيام متبقية',
  'label.day_n': 'يوم',
  'label.gift': 'هدية',
  'label.next_income': 'الدخل القادم',
  'label.earned_income': 'الأرباح المحققة',
  'label.pending_income': 'أرباح معلقة',
  'label.total_income': 'إجمالي الأرباح',
  'label.purchase_time': 'تاريخ الشراء',
  'label.complete_time': 'تاريخ الانتهاء',
  'label.purchase_amount': 'مبلغ الاستثمار',
  'label.daily_income': 'الدخل اليومي',
  'label.cycle_days': 'مدة الدورة',
  'label.all_income_received': 'تم استلام جميع الأرباح',
  'label.total_earned': 'إجمالي الأرباح',
  'label.active_positions': 'نشطة',
  'label.today_income': 'اليوم',
  'label.total_invested': 'الاستثمار',
  'label.completed_positions': 'مكتملة',
  'label.next_income_countdown': 'الدخل القادم خلال',
  'label.settle_time': 'وقت التسوية',
  'label.expected_income': 'الدخل المتوقع',

  // 占位符
  'placeholder.phone': '6XXXXXXXX',
  'placeholder.password': 'أدخل كلمة المرور',
  'placeholder.password_register': 'أحرف + أرقام، 6 كحد أدنى',
  'placeholder.confirm_password': 'أكّد كلمة المرور الجديدة',
  'placeholder.invite_code': 'أدخل رمزاً من 8 أحرف',
  'placeholder.old_password': 'أدخل كلمة المرور الحالية',
  'placeholder.new_password': 'أدخل كلمة المرور الجديدة',
  'placeholder.nickname': 'أدخل اسمك',
  'placeholder.select_bank': 'اختيار البنك',
  'placeholder.search_bank': 'بحث عن بنك...',
  'placeholder.account_no': 'أدخل رقم الحساب',
  'placeholder.account_name': 'أدخل الاسم الكامل',

  // 首页
  'home.subtitle': 'منصتك الاستثمارية الموثوقة',
  'home.earnings': 'أرباح اليوم',
  'home.signIn': 'تسجيل الحضور',
  'home.availableBalance': 'الرصيد المتاح',
  'home.frozenBalance': 'الرصيد المجمّد',
  'home.todayIncome': 'أرباح اليوم',
  'home.totalIncome': 'إجمالي الأرباح',
  'home.hideBalance': 'إخفاء الرصيد',
  'home.showBalance': 'إظهار الرصيد',
  'home.recommendProducts': 'منتجات موصى بها',
  'home.noProducts': 'لا توجد منتجات متاحة',
  'home.features': 'المميزات',
  'home.feature_design_title': 'تصميم 2026',
  'home.feature_design_desc': 'تصميم فاخر بألوان فاتحة ومساحات واسعة',
  'home.feature_security_title': 'أمان مضمون',
  'home.feature_security_desc': 'حماية البيانات ومعاملات آمنة',
  'home.feature_return_title': 'عوائد مرتفعة',
  'home.feature_return_desc': 'عوائد يومية جذابة لاستثمارك',
  'home.design_system': 'نظام التصميم',
  'home.color_palette': 'لوحة الألوان',
  'home.color_subtitle': 'ألوان ناعمة وأنيقة',
  'home.primary_orange': 'برتقالي أنيق (أساسي)',
  'home.warm_neutral': 'رمادي دافئ (محايد)',
  'home.trend_colors': 'ألوان رائجة 2026',
  'home.lavender': 'لافندر',
  'home.mint': 'نعناع',
  'home.button_variants': 'أنواع الأزرار',
  'home.btn_primary': 'أساسي',
  'home.btn_secondary': 'ثانوي',
  'home.btn_ghost': 'شبحي',
  'home.btn_destructive': 'خطر',
  'home.btn_link': 'رابط',
  'home.btn_loading': 'تحميل',
  'home.status_badges': 'شارات الحالة',
  'home.badge_primary': 'أساسي',

  // 业务相关
  'biz.daily_income': 'الدخل اليومي',
  'biz.cycle_days': 'الدورة',
  'biz.available_balance': 'الرصيد المتاح',
  'biz.frozen_balance': 'الرصيد المجمّد',
  'biz.frozen_balance_tip': 'يتم فتح الرصيد المجمّد تلقائياً عند اكتمال الدورة',
  'biz.today_income': 'أرباح اليوم',

  // 提示
  'tip.no_more_data': 'لا مزيد من البيانات',
  'tip.refreshing': 'جارٍ التحديث...',
  'tip.release_to_refresh': 'اترك للتحديث',
  'tip.pull_to_refresh': 'اسحب للتحديث',
  'tip.phone_format': 'يجب أن يتكون الرقم من 9 أرقام',
  'tip.password_min': 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
  'tip.password_format': 'يجب أن تحتوي كلمة المرور على أحرف وأرقام',
  'tip.loading': 'جارٍ التحميل...',
  'tip.loading_more': 'جارٍ تحميل المزيد...',
  'tip.amount_range': 'النطاق: {min} - {max}',
  'tip.no_account': 'ليس لديك حساب؟',
  'tip.has_account': 'لديك حساب بالفعل؟',
  'tip.frozen_balance': 'الرصيد المجمّد يشمل السحوبات قيد المعالجة',
  'tip.countdown_label': 'الوقت المتبقي',
  'tip.withdraw_outside_time': 'خارج أوقات السحب',
  'tip.withdraw_limit_reached': 'لقد بلغت الحد الأقصى للسحوبات اليومية',
  'tip.withdraw_bank_note': 'يمكنك السحب فقط إلى البطاقات المسجلة',
  'tip.enter_amount_to_calculate': 'أدخل المبلغ للحساب',
  'tip.cards_secure_title': 'بياناتك آمنة',
  'tip.cards_secure_desc': 'جميع المعلومات البنكية مشفرة ومحمية',
  'tip.max_cards_reached': 'تم بلوغ الحد الأقصى',
  'tip.add_card_hint': 'اضغط لإضافة بطاقة بنكية',
  'tip.image_drag': 'اسحب للعرض · انقر مرتين لإعادة التعيين',
  'tip.image_zoom': 'انقر مرتين للتكبير · انقر خارجاً للإغلاق',

  // 单位
  'unit.days': ' أيام',
  'unit.day': 'يوم',

  // 通用
  'common.close': 'إغلاق',
  'common.confirm': 'تأكيد',
  'common.viewMore': 'عرض المزيد',
  'common.or_above': 'أو أعلى',
  'common.retry': 'إعادة المحاولة',

  // 公告
  'announcement.dontShowAgain': 'لا تعرض مرة أخرى',
  'announcement.type.important': 'مهم',
  'announcement.type.urgent': 'عاجل',

  // 个人中心菜单（key格式：menu.{入口key}，与后台文案管理统一配置对接）
  'menu.positions': 'استثماراتي',
  'menu.recharge_history': 'سجل الإيداعات',
  'menu.withdraw_history': 'سجل السحوبات',
  'menu.transactions': 'المعاملات',
  'menu.team': 'فريقي',
  'menu.bank_cards': 'البطاقات البنكية',
  'menu.security': 'الأمان',
  'menu.about': 'من نحن',
  'menu.support': 'الدعم',
  'menu.settings': 'الإعدادات',
  'menu.messages': 'الرسائل',
  'menu.invite': 'دعوة أصدقاء',

  // 无障碍标签 (aria-labels)
  'aria.close': 'إغلاق',
  'aria.close_preview': 'إغلاق المعاينة',
  'aria.zoom_in': 'تكبير',
  'aria.zoom_out': 'تصغير',
  'aria.prev_slide': 'السابق',
  'aria.next_slide': 'التالي',
  'aria.go_to_slide': 'الانتقال للشريحة {number}',

  // 无障碍辅助文案 (a11y)
  'a11y.modal': 'نافذة حوار',
  'a11y.modal_content': 'محتوى نافذة الحوار',

  // 链接
  'link.go_login': 'تسجيل الدخول',

  // 签到相关
  'signin.title': 'تسجيل الحضور',
  'signin.daily.reward': 'مكافأة يومية',
  'signin.btn.checkin': 'تسجيل الحضور',
  'signin.done': 'مكتمل',
  'signin.success': 'تم تسجيل الحضور بنجاح',
  'signin.normal_completed': 'لقد أكملت تسجيل الحضور لمدة 3 أيام! اشترِ منتجاً للمتابعة.',
  'signin.window_expired': 'انتهت فترة تسجيل الحضور. اشترِ منتجاً للمتابعة.',
  'signin.window_remaining': 'متبقي {remaining} أيام لإكمال تسجيل الحضور',
  'signin.continuous_days': 'اليوم {n} من تسجيل الحضور المتتالي',
  'signin.total_reward': 'إجمالي المكافآت',
  'signin.go_activities': 'عرض المزيد من الأنشطة',
  'signin.btn_go_buy': 'اذهب للشراء',
  'signin.error.load': 'خطأ في تحميل حالة تسجيل الحضور',
  'signin.calendar.title': 'تقويم تسجيل الحضور',
  'signin.days': 'أيام',
  'signin.today': 'اليوم',
  'signin.day': 'يوم',
  'signin.progress.title': 'تقدم تسجيل الحضور',
  'signin.svip.title': 'تسجيل حضور حصري',
  'signin.svip.subtitle': 'مكافأة مضاعفة يومياً',
  'signin.svip.reward': 'مكافأة',
  'signin.svip.upgrade': 'SVIP يحصل على الضعف',
  'signin.claimed': 'تم المطالبة',
  'signin.available': 'متاح',
  'signin.btn.claim': 'مطالبة',

  // 签到 Toast 提示
  'toast.signin_success': 'تم تسجيل الحضور بنجاح! +{amount}',

  // 首页签到（已签到状态）
  'home.signedIn': 'تم التسجيل',

  // 奖励弹窗相关
  'reward.register_title': 'تم التسجيل بنجاح!',
  'reward.register_subtitle': 'لقد حصلت على {amount} كمكافأة ترحيب',
  'reward.register_primary': 'ابدأ بالاستكشاف',
  'reward.register_secondary': 'عرض أصولي',
  'reward.purchase_title': 'تم الشراء بنجاح!',
  'reward.purchase_subtitle': 'تمت إضافة المنتج إلى استثماراتك',
  'reward.purchase_primary': 'عرض استثماراتي',
  'reward.purchase_secondary': 'متابعة الشراء',
  'reward.signin_title': 'تم تسجيل الحضور بنجاح!',
  'reward.signin_subtitle': 'مكافأة تسجيل الحضور: {amount}',
  'reward.signin_primary': 'رائع',
  'reward.invite_title': 'مكافأة الدعوة!',
  'reward.invite_subtitle': 'لقد حصلت على مكافأة مقابل دعوتك',
  'reward.invite_primary': 'دعوة المزيد من الأصدقاء',
  'reward.invite_secondary': 'إغلاق',
  'reward.vip_title': 'تهانينا!',
  'reward.vip_subtitle': 'تم تحديث مستوى VIP الخاص بك',
  'reward.vip_primary': 'عرض المزايا',
  'reward.default_title': 'نجاح!',

  // 对话框相关
  'dialog.cancel_order_title': 'إلغاء الطلب',
  'dialog.cancel_order_message': 'هل أنت متأكد من إلغاء هذا الطلب؟',
  'dialog.logout_title': 'تسجيل الخروج',
  'dialog.logout_desc': 'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
  'dialog.delete_card_title': 'حذف البطاقة',
  'dialog.delete_card_msg': 'هل أنت متأكد من حذف هذه البطاقة البنكية؟',
  'dialog.withdraw_threshold_title': 'لا يمكن السحب',
  'dialog.withdraw_threshold_msg': 'يجب عليك الإيداع وشراء منتج مدفوع لتفعيل السحب',
  'dialog.bind_card_first': 'أضف بطاقة أولاً',
  'dialog.bind_card_first_msg': 'يرجى إضافة بطاقة بنكية قبل السحب',
  'dialog.vip_required_title': 'مستوى VIP مطلوب',
  'dialog.vip_required_msg': 'تحتاج أن تكون VIP{level} أو أعلى لشراء هذا المنتج.',
  'dialog.required_level': 'المستوى المطلوب',
  'dialog.upgrade_tip': 'اشترِ منتجات Po لرفع مستوى VIP.',

  // 表单验证相关
  'validation.required': 'هذا الحقل مطلوب',
  'validation.password_min_length': 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل',
  'validation.password_max_length': 'لا يمكن أن تتجاوز كلمة المرور {max} حرف',
  'validation.password_require_letter': 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل',
  'validation.password_require_number': 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل',
  'validation.password_not_match': 'كلمات المرور غير متطابقة',
  'validation.password_same_as_old': 'كلمة المرور الجديدة لا يمكن أن تكون مثل السابقة',

  // 产品相关
  'product.recommend': 'موصى به',
  'product.detail': 'التفاصيل',
  'product.price': 'السعر',
  'product.cycle': 'الدورة',
  'product.grant_vip_desc': 'اشترِ هذا المنتج واحصل على مزايا VIP',
  'product.income_calc': 'حاسبة الأرباح',
  'product.daily': 'يومي',
  'product.days': 'أيام',
  'product.total': 'الإجمالي',
  'products.title_line1': 'استثمارات',
  'products.title_line2': 'عقارية',
  'product.coming_soon': 'قريباً',
  'product.limit': 'الحد',
  'product.stock_remaining': 'المتبقي',

  // 额外的错误提示
  'error.user_not_found': 'المستخدم غير موجود',
  'error.bank_disabled': 'هذا البنك غير متاح',
  'error.bank_card_blacklisted': 'هذه البطاقة غير مسموح بها',
  'error.document_type_required': 'اختر نوع الوثيقة',
  'error.document_no_required': 'أدخل رقم الوثيقة',
  'error.account_type_required': 'اختر نوع الحساب',
  'error.cci_required': 'أدخل رمز CCI',
  'error.pay_url_invalid': 'رابط الدفع غير صالح',
  'error.order_not_found_desc': 'الطلب الذي تبحث عنه غير موجود أو تم حذفه',
  'error.password_min_length': 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل',
  'error.password_max_length': 'لا يمكن أن تتجاوز كلمة المرور {max} حرف',

  // 额外的空状态
  'empty.no_banks_found': 'لم يتم العثور على بنوك',
  'empty.position_active': 'ليس لديك استثمارات نشطة',
  'empty.position_completed': 'ليس لديك استثمارات مكتملة',
  'empty.position_active_desc': 'استكشف منتجاتنا لبدء الاستثمار',
  'empty.position_completed_desc': 'ستظهر الاستثمارات المكتملة هنا',
  'empty.income_records': 'لا توجد سجلات أرباح بعد',

  // 额外的标签
  'label.password': 'كلمة المرور',
  'label.phone_prefix': '+212',

  // 额外的提示
  'tip.countdown': 'الوقت المتبقي: {time}',
  'tip.cci_format': 'رمز الحساب البنكي المشترك',
  'tip.password_rule': 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل، وتشمل أحرفاً وأرقاماً',

  // 额外的占位符
  'placeholder.document_no': 'أدخل رقم الوثيقة',
  'placeholder.cci_code': 'أدخل رمز CCI',

  // 额外的业务字段
  'biz.price': 'السعر',
  'biz.total_return': 'إجمالي العائد',

  // 额外的标题
  'title.income_records': 'سجل الأرباح',

  // 额外的状态
  'status.settled': 'تمت التسوية',

  // 选项文案（银行卡表单）
  'option.cc': 'بطاقة الهوية الوطنية',
  'option.ce': 'بطاقة الإقامة',
  'option.nit': 'الرقم الضريبي',
  'option.pp': 'جواز السفر',
  'option.ahorros': 'توفير',
  'option.corriente': 'جاري',

  // 密码强度
  'password.strength': 'الأمان',
  'password.weak': 'ضعيفة',
  'password.medium': 'متوسطة',
  'password.strong': 'قوية',

  // 额外的业务字段（提现详情页）
  'biz.withdraw_time': 'أوقات السحب',
  'biz.withdraw_limit': 'الحد اليومي',
  'biz.withdraw_remaining': 'المتبقية',
  'biz.withdraw_range': 'نطاق المبلغ',
  'biz.apply_amount': 'المبلغ المطلوب',
  'biz.fee': 'عمولة',
  'biz.actual_amount': 'المبلغ الفعلي',
  'biz.order_no': 'رقم الطلب',
  'biz.status': 'الحالة',
  'biz.channel_name': 'قناة الدفع',
  'biz.bank_name': 'البنك',
  'biz.account_no': 'رقم الحساب',
  'biz.account_name': 'صاحب الحساب',
  'biz.reject_reason': 'سبب الرفض',
  'biz.create_time': 'تاريخ الإنشاء',
  'biz.expire_time': 'وقت الانتهاء',
  'biz.complete_time': 'تاريخ الدفع',
  'biz.review_time': 'تاريخ المراجعة',

  // 忘记密码页
  'page.forgot_password_title': 'نسيت كلمة المرور؟',
  'page.forgot_password_subtitle': 'لا تقلق، نحن هنا لمساعدتك',
  'page.forgot_password_desc': 'لاسترداد حسابك، يرجى التواصل مع فريق الدعم لدينا عبر القنوات التالية:',
  'link.forgot_password': 'نسيت كلمة المرور؟',
  'link.back_to_login': 'العودة لتسجيل الدخول',

  // 额外的链接
  'link.go_register': 'سجّل حسابك',

  // 额外的提现记录描述
  'empty.withdraw_record_desc': 'قم بإجراء سحب لرؤية السجل هنا',

  // 邀请码验证
  'error.invite_code_format': 'يجب أن يتكون رمز الدعوة من 8 أحرف',
  'error.invite_code_invalid': 'رمز الدعوة غير صالح',

  // 社区相关
  'community.title': 'المجتمع',
  'community.subtitle': 'شارك تجربتك مع الآخرين',
  'community.empty': 'لا توجد منشورات',
  'community.empty_desc': 'كن أول من ينشر تجربته',
  'community.my_posts': 'منشوراتي',
  'community.my_empty': 'ليس لديك منشورات بعد',
  'community.my_empty_desc': 'شارك تجربتك في السحب',
  'community.create_first': 'إنشاء منشور',
  'community.detail': 'تفاصيل المنشور',
  'community.comments': 'التعليقات',
  'community.no_comments': 'لا توجد تعليقات بعد',
  'community.write_comment': 'اكتب تعليقاً',
  'community.comment_placeholder': 'اكتب تعليقاً...',
  'community.tap_to_upload': 'انقر للرفع',
  'community.invalid_image_type': 'يُسمح فقط بصور JPG و PNG و WebP',
  'community.image_too_large': 'لا يمكن أن يتجاوز حجم الصورة 5MB',
  'community.platform_screenshot': 'لقطة من المنصة',
  'community.platform': 'المنصة',
  'community.receipt_screenshot': 'إيصال السحب',
  'community.receipt': 'الإيصال',
  'community.reject_reason': 'سبب الرفض',

  // 活动阶梯
  'activity.tier.claimed': 'تم المطالبة',
  'activity.tier.claiming': 'جارٍ المطالبة...',
  'activity.tier.claim': 'مطالبة',

  // 邀请活动
  'invite.status_claimed': 'تم المطالبة',
  'invite.status_claimable': 'مطالبة',
  'invite.next_goal_need': 'باقي {n}',
  'invite.stat_valid': 'صالحة',
  'invite.stat_earned': 'مكتسب',
  'invite.stat_next': 'التالي',
  'invite.all_completed': 'لقد أكملت جميع المستويات!',

  // 周薪
  'weekly.tier_level': 'المستوى',
  'weekly.claimed': 'تم المطالبة',
  'weekly.threshold': 'الهدف',
  'weekly.reward': 'المكافأة',

  // 奖池
  'pool.invites': 'دعوات',
  'pool.claimed': 'تم المطالبة',

  // 转盘
  'spin.thanks': 'شكراً',

  // 消息
  'messages.title': 'الرسائل',
  'messages.detail_title': 'تفاصيل الرسالة',
  'messages.not_found': 'الرسالة غير موجودة',
  'messages.mark_all_read': 'تحديد الكل كمقروء',
  'messages.empty.title': 'لا توجد رسائل',
  'messages.empty.description': 'ستظهر رسائلك هنا',

  // 团队
  'team.all': 'الكل',
  'team.noMembers': 'لا يوجد أعضاء بعد',
  'team.inviteFriends': 'ادعُ أصدقاءك للانضمام',
  'team.noCommissions': 'لا توجد عمولات بعد',
  'team.inviteToEarn': 'ادعُ أصدقاءك لكسب العمولات',
  'team.members': 'أعضاء',
  'team.commission_product': 'المنتج',
  'team.commission_rate': 'النسبة',

  // 进度
  'label.progress': 'التقدم',
  'label.day_abbr': 'يوم',

  // 关于
  'about.contact_title': 'اتصل بنا',

  // 礼品码
  'gift_code.title': 'رمز الهدية',
  'gift_code.subtitle': 'أدخل رمز الهدية للحصول على المكافأة',
  'gift_code.enter_code': 'أدخل رمز الهدية',
  'gift_code.placeholder': 'أدخل الرمز هنا',
  'gift_code.redeem_btn': 'استرداد',
  'gift_code.redeeming': 'جارٍ الاسترداد...',
  'gift_code.history_title': 'سجل الاسترداد',
  'gift_code.no_history': 'لا يوجد سجل',
  'toast.redeem_failed': 'خطأ في الاسترداد',

  // 购买确认
  'purchase.success': 'تم الشراء بنجاح',
  'purchase.success_desc': 'تمت إضافة المنتج إلى استثماراتك',
  'purchase.failed': 'فشل الشراء',
  'purchase.confirm_title': 'تأكيد الشراء',
  'purchase.confirm_desc': 'هل تريد شراء هذا المنتج؟',

  // SVIP 页面
  'svip.page_title': 'مكافأة SVIP اليومية',
  'svip.current_level': 'المستوى الحالي',
  'svip.not_unlocked': 'لم يتم فتح SVIP بعد',
  'svip.unlock_hint': 'اشترِ منتجين من نفس النوع لفتح المستوى',
  'svip.daily_total': 'المكافأة اليومية',
  'svip.qualified_levels': 'المستويات المؤهلة',
  'svip.all_levels': 'جميع المستويات',
  'svip.per_day': '/ يومياً',
  'svip.progress': 'التقدم',
  'svip.reward_history': 'سجل المكافآت',
};

/**
 * 文案 Store
 */
export const useTextStore = create<TextState>()(
  persist(
    (set, get) => ({
      texts: defaultTexts,
      version: 0,
      isLoaded: false,

      setTexts: (texts) =>
        set({
          texts: { ...defaultTexts, ...texts },
          isLoaded: true,
        }),

      setVersion: (version) => set({ version }),

      setLoaded: (isLoaded) => set({ isLoaded }),

      getText: (key, defaultValue) => {
        const texts = get().texts;
        return texts[key] || defaultValue || key;
      },

      reset: () =>
        set({
          texts: defaultTexts,
          version: 0,
          isLoaded: false,
        }),
    }),
    {
      name: 'text-storage',
      version: 2,
      migrate: () => ({
        texts: defaultTexts,
        version: 0,
      }),
      partialize: (state) => ({
        texts: state.texts,
        version: state.version,
      }),
      skipHydration: true,
    }
  )
);

/**
 * 获取文案（非 Hook 版本）
 * @description 用于非组件环境获取文案
 */
export function t(key: string, defaultValue?: string): string {
  return useTextStore.getState().getText(key, defaultValue);
}

/**
 * 获取带变量替换的文案
 * @param key - 文案 key
 * @param variables - 变量对象
 * @returns 替换后的文案
 */
export function tWithVars(key: string, variables: Record<string, string | number>): string {
  let text = useTextStore.getState().getText(key);
  
  Object.entries(variables).forEach(([varKey, value]) => {
    text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
  });
  
  return text;
}
