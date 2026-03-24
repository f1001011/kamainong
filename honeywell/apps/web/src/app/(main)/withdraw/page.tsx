/**
 * @file 提现页
 * @description 用户出金页面，清晰透明的资金操作体验
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md
 * 
 * 2026高端美学设计要点：
 * - 页面背景：柔和渐变 from-neutral-50 to-white
 * - 余额展示：大号字体 + AnimatedNumber 动画 + 冻结余额显示
 * - 费用计算浮层：在金额输入卡片内，毛玻璃效果
 * - 银行卡选择：横向滚动卡片式选择器
 * - 限制提示区：时间窗口、每日次数、金额范围
 * - 不可提现状态：弹窗引导，而非直接显示
 * 
 * API调用（依据：03.5.1-提现页.md 页面信息 - 依赖API）：
 * - GET /api/withdraw/check - 提现条件检查
 * - GET /api/bank-cards - 银行卡列表（独立API）
 * - GET /api/user/profile - 冻结余额
 * - POST /api/withdraw/create - 创建提现订单
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RiArrowLeftSLine,
  RiFileListLine,
  RiShieldCheckLine,
  RiLoader4Line,
  RiChat3Line,
} from '@remixicon/react';
import { toast } from 'sonner';
import { m } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TipsCard } from '@/components/ui/tips-card';
import { AmountSelector } from '@/components/ui/amount-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { FeeCalculator, BankCardSelector, WithdrawLimits, type BankCardData } from '@/components/withdraw';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { get, post, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation';
import { haptic } from '@/lib/haptic';

// ============================================
// 类型定义
// ============================================

/**
 * 不可提现原因枚举
 * 依据：03.5.1-提现页.md 第2.1节
 */
type WithdrawBlockReason = 
  | 'THRESHOLD_NOT_MET'   // 提现门槛未满足
  | 'NOT_RECHARGED'       // 未充值过
  | 'NO_BANK_CARD'        // 未绑定银行卡
  | 'TIME_INVALID'        // 非提现时间
  | 'LIMIT_EXCEEDED'      // 超出每日次数限制
  | null;

/**
 * 提现条件检查响应
 * 依据：03.5.1-提现页.md 第6.3节
 */
interface WithdrawCheckResponse {
  canWithdraw: boolean;
  reason: WithdrawBlockReason;
  hasRecharged: boolean;
  hasPurchasedPaid: boolean;
  availableBalance: string;
  feePercent: number;
  minAmount: string;
  maxAmount: string;
  timeRange: string;
  inTimeRange: boolean;
  todayCount: number;
  dailyLimit: number;
  quickAmounts: number[];
  tips: string;
}

/**
 * 银行卡列表响应
 * 依据：03.5.1-提现页.md 第6.3节
 */
interface BankCardsResponse {
  list: BankCardData[];
  maxCount: number;
  canAdd: boolean;
}

/**
 * 用户余额信息
 * 依据：03.5.1-提现页.md 第2.2节
 */
interface UserBalanceResponse {
  availableBalance: string;
  frozenBalance: string;
}

/**
 * 创建提现请求
 * 依据：03.5.1-提现页.md 第6.3节
 */
interface CreateWithdrawRequest {
  amount: string;
  bankCardId: number;
  [key: string]: unknown;
}

/**
 * 创建提现响应
 */
interface CreateWithdrawResponse {
  orderId: number;
  orderNo: string;
  amount: string;
  fee: string;
  actualAmount: string;
}

/**
 * 向下取整到分（0.01）
 * @description 依据：开发文档.md 第16.5节 - 金额计算精度规则
 */
function floorToCent(value: number): number {
  return Math.floor(value * 100) / 100;
}

// ============================================
// 主组件
// ============================================

export default function WithdrawPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();

  // === 数据状态 ===
  const [isLoading, setIsLoading] = useState(true);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [blockReason, setBlockReason] = useState<WithdrawBlockReason>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [feePercent, setFeePercent] = useState(10);
  const [minAmount, setMinAmount] = useState(12000);
  const [maxAmount, setMaxAmount] = useState(0);
  const [timeRange, setTimeRange] = useState('10:00-17:00');
  const [inTimeRange, setInTimeRange] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(1);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([]);
  const [tips, setTips] = useState('');
  
  // 银行卡数据
  const [bankCards, setBankCards] = useState<BankCardData[]>([]);
  const [bankCardsMaxCount, setBankCardsMaxCount] = useState(3);
  const [bankCardsCanAdd, setBankCardsCanAdd] = useState(true);
  const [isBankCardsLoading, setIsBankCardsLoading] = useState(true);

  // === 表单状态 ===
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // === 提交状态 ===
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 弹窗状态 ===
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [showBindCardDialog, setShowBindCardDialog] = useState(false);

  // 货币符号
  const currencySymbol = config.currencySymbol || 'د.م.';

  // ============================================
  // 数据加载
  // ============================================

  /**
   * 加载提现条件检查
   * 依据：03.5.1-提现页.md 第6.2节 - 数据加载顺序
   */
  const loadWithdrawCheck = useCallback(async () => {
    try {
      const data = await get<WithdrawCheckResponse>('/withdraw/check');

      setCanWithdraw(data.canWithdraw);
      setBlockReason(data.reason);
      setAvailableBalance(parseFloat(data.availableBalance) || 0);
      setFeePercent(data.feePercent);
      setMinAmount(parseFloat(data.minAmount) || 12000);
      setMaxAmount(parseFloat(data.maxAmount) || 0);
      setTimeRange(data.timeRange || '10:00-17:00');
      setInTimeRange(data.inTimeRange);
      setTodayCount(data.todayCount || 0);
      setDailyLimit(data.dailyLimit || 1);
      setQuickAmounts(data.quickAmounts || []);
      setTips(data.tips || '');

      return data;
    } catch (error) {
      console.error('加载提现条件失败:', error);
      toast.error(t('error.network'));
      throw error;
    }
  }, [t]);

  /**
   * 加载银行卡列表
   * 依据：03.5.1-提现页.md 第2.3节 - 银行卡列表独立 API
   */
  const loadBankCards = useCallback(async () => {
    try {
      setIsBankCardsLoading(true);
      const data = await get<BankCardsResponse>('/bank-cards');

      setBankCards(data.list || []);
      setBankCardsMaxCount(data.maxCount || 3);
      setBankCardsCanAdd(data.canAdd !== false);

      // 自动选中第一张卡
      if (data.list && data.list.length > 0) {
        setSelectedCardId(data.list[0].id);
      }

      return data;
    } catch (error) {
      console.error('加载银行卡列表失败:', error);
      // 银行卡加载失败不阻断页面
    } finally {
      setIsBankCardsLoading(false);
    }
  }, []);

  /**
   * 加载用户余额信息（冻结余额）
   * 依据：03.5.1-提现页.md 第2.2节 - 冻结余额从 /api/user/profile 获取
   */
  const loadUserBalance = useCallback(async () => {
    try {
      const data = await get<UserBalanceResponse>('/user/profile');
      setFrozenBalance(parseFloat(data.frozenBalance) || 0);
    } catch (error) {
      console.error('加载用户余额失败:', error);
      // 余额加载失败不阻断页面
    }
  }, []);

  /**
   * 并行加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 并行加载所有数据
      await Promise.all([
        loadWithdrawCheck(),
        loadBankCards(),
        loadUserBalance(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadWithdrawCheck, loadBankCards, loadUserBalance]);

  // 页面加载时获取数据
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============================================
  // 计算属性
  // ============================================

  /**
   * 最终提交金额
   */
  const finalAmount = useMemo(() => {
    if (selectedAmount !== null) {
      return selectedAmount;
    }
    if (customAmount) {
      const amount = parseFloat(customAmount);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  }, [selectedAmount, customAmount]);

  /**
   * 金额校验
   * 依据：03.5.1-提现页.md 第6.4节 - validateAmount
   */
  const validateAmount = useCallback((amount: number): string | null => {
    if (amount < minAmount) {
      return t('error.amount_min')
        .replace('{min}', formatCurrency(minAmount, config));
    }
    if (amount > maxAmount) {
      return t('error.amount_max')
        .replace('{max}', formatCurrency(maxAmount, config));
    }
    if (amount > availableBalance) {
      return t('error.insufficient_balance');
    }
    return null;
  }, [minAmount, maxAmount, availableBalance, t, config]);

  /**
   * 金额是否有效
   */
  const isAmountValid = useMemo(() => {
    if (finalAmount <= 0) return false;
    return validateAmount(finalAmount) === null;
  }, [finalAmount, validateAmount]);

  /**
   * 金额错误信息
   */
  const amountError = useMemo(() => {
    // 没有输入金额时不显示错误
    if (finalAmount <= 0) return undefined;
    
    // 只有自定义输入时才检查（预设档位默认在范围内）
    if (selectedAmount !== null) return undefined;
    
    return validateAmount(finalAmount) || undefined;
  }, [finalAmount, selectedAmount, validateAmount]);

  /**
   * 是否可提交
   * 依据：03.5.1-提现页.md 第6.4节 - canSubmit
   */
  const canSubmit = useMemo(() => {
    // 必须可提现
    if (!canWithdraw) return false;
    
    // 必须在时间窗口内
    if (!inTimeRange) return false;
    
    // 不能超过每日次数限制
    if (todayCount >= dailyLimit) return false;
    
    // 金额必须有效
    if (!isAmountValid) return false;
    
    // 必须选择银行卡
    if (selectedCardId === null) return false;
    
    // 不能正在提交
    if (isSubmitting) return false;

    return true;
  }, [canWithdraw, inTimeRange, todayCount, dailyLimit, isAmountValid, selectedCardId, isSubmitting]);

  // ============================================
  // 事件处理
  // ============================================

  /**
   * 返回上一页
   */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * 跳转到提现记录
   * 依据：03.5.1-提现页.md 第3.3节 - 记录入口图标 RiFileListLine
   */
  const handleViewRecords = useCallback(() => {
    router.push('/withdraw/records');
  }, [router]);

  /**
   * 处理全部提现
   * 依据：03.5.1-提现页.md 第6.4节 - handleAllIn
   */
  const handleWithdrawAll = useCallback(() => {
    const maxWithdrawable = Math.min(maxAmount, availableBalance);
    setCustomAmount(maxWithdrawable.toString());
    setSelectedAmount(null);
  }, [maxAmount, availableBalance]);

  /**
   * 跳转到添加银行卡
   * 依据：03.5.1-提现页.md 第6.6节 - 绑卡成功后自动跳转回提现页
   */
  const handleAddBankCard = useCallback(() => {
    router.push('/bank-cards/add');
  }, [router]);

  /**
   * 处理门槛未满足弹窗确认
   */
  const handleThresholdConfirm = useCallback(() => {
    setShowThresholdDialog(false);
    router.push('/products');
  }, [router]);

  /**
   * 处理绑卡弹窗确认
   * 依据：03.5.1-提现页.md 第6.6节 - handleGoToBindCard
   */
  const handleBindCardConfirm = useCallback(() => {
    setShowBindCardDialog(false);
    router.push('/bank-cards/add');
  }, [router]);

  /**
   * 提交提现申请
   * 依据：03.5.1-提现页.md 第6.4节 - handleSubmit
   */
  const handleSubmit = useCallback(async () => {
    // 校验
    if (!canSubmit || selectedCardId === null) return;

    // 检查是否有银行卡
    if (bankCards.length === 0) {
      setShowBindCardDialog(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // 构建请求
      const requestBody: CreateWithdrawRequest = {
        amount: finalAmount.toFixed(2),
        bankCardId: selectedCardId,
      };

      // 创建提现订单
      await post<CreateWithdrawResponse>('/withdraw/create', requestBody);

      // 触觉反馈 - 成功振动
      haptic('success');

      // 显示成功提示
      // 依据：03.5.1-提现页.md 第2.5节 - toast.withdraw_success
      toast.success(t('toast.withdraw_success'), {
        duration: 4000,
        action: {
          label: t('community.share_proof'),
          onClick: () => router.push('/community/create'),
        },
      });

      // 刷新数据（保持当前页）
      // 依据：03.5.1-提现页.md 第6.4节 - 提交成功后刷新数据，不跳转
      await Promise.all([
        loadWithdrawCheck(),
        loadUserBalance(),
      ]);

      // 重置表单
      setSelectedAmount(null);
      setCustomAmount('');
    } catch (error) {
      console.error('创建提现订单失败:', error);

      // 触觉反馈 - 错误振动
      haptic('error');

      if (error instanceof ApiError) {
        // 处理特定错误码
        switch (error.code) {
          case 'WITHDRAW_THRESHOLD_NOT_MET':
            setShowThresholdDialog(true);
            break;
          case 'BANK_CARD_REQUIRED':
            setShowBindCardDialog(true);
            break;
          case 'WITHDRAW_TIME_INVALID':
            toast.error(t('tip.withdraw_outside_time'));
            break;
          case 'WITHDRAW_LIMIT_EXCEEDED':
            toast.error(t('tip.withdraw_limit_reached'));
            break;
          case 'INSUFFICIENT_BALANCE':
            toast.error(t('error.insufficient_balance'));
            break;
          default:
            toast.error(t('error.server'));
        }
      } else {
        toast.error(t('error.network'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, selectedCardId, bankCards.length, finalAmount, t, loadWithdrawCheck, loadUserBalance]);

  // ============================================
  // 根据 blockReason 显示对应弹窗
  // ============================================
  useEffect(() => {
    if (!isLoading && blockReason) {
      if (blockReason === 'THRESHOLD_NOT_MET' || blockReason === 'NOT_RECHARGED') {
        setShowThresholdDialog(true);
      } else if (blockReason === 'NO_BANK_CARD') {
        setShowBindCardDialog(true);
      }
    }
  }, [isLoading, blockReason]);

  // ============================================
  // 渲染
  // ============================================

  // 加载中骨架屏
  if (isLoading) {
    return <WithdrawPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航栏 - 2.0 极致毛玻璃 */}
      <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-4 right-4 h-[0.5px] bg-gradient-to-r from-transparent via-primary-200/20 to-transparent" />
        
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-neutral-50/80 active:scale-95 transition-all"
        >
          <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
        </button>
        
        <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
          {t('page.withdraw')}
        </h1>
        
        <button
          type="button"
          onClick={handleViewRecords}
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-xl hover:bg-neutral-50/80 active:scale-95 transition-all"
        >
          <RiFileListLine className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* 页面内容 */}
      {/* 依据：03.5.1-提现页.md 第4.3节 - 电脑端两列布局，移动端单列 */}
      <div className="px-4 py-5">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
          {/* 左列：信息层（余额卡片 + 提示文案 + 限制提示） */}
          <div className="space-y-5">
            {/* 余额卡片 */}
            {/* 依据：03.5.1-提现页.md 第4.2节 - 余额卡片（BalanceDisplay） */}
            <Card padding="lg" className="bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl">
              <div className="space-y-3">
                {/* 可用余额标签 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">
                    {t('biz.available_balance')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                    className="text-xs text-primary-500"
                  >
                    {isBalanceHidden ? t('action.show') : t('action.hide')}
                  </button>
                </div>

                {/* 可用余额数字（大字体主色） */}
                <div className="text-3xl font-bold text-neutral-800 tracking-tight">
                  {isBalanceHidden ? (
                    <span>{currencySymbol} ****</span>
                  ) : (
                    <AnimatedNumber
                      value={availableBalance}
                      prefix={`${currencySymbol} `}
                      decimals={config?.currencyDecimals ?? 0}
                    />
                  )}
                </div>

                {/* 冻结余额（小字体灰色） */}
                {/* 依据：03.5.1-提现页.md 第2.2节 - 冻结余额从 /api/user/profile 获取 */}
                <div className="text-sm text-neutral-400">
                  {t('biz.frozen_balance')}: {' '}
                  {isBalanceHidden ? (
                    '****'
                  ) : (
                    <AnimatedNumber
                      value={frozenBalance}
                      prefix={`${currencySymbol} `}
                      decimals={config?.currencyDecimals ?? 0}
                      className="text-neutral-500"
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* 限制提示区 */}
            {/* 依据：03.5.1-提现页.md 第4.2节 - 限制提示区 */}
            <WithdrawLimits
              timeRange={timeRange}
              inTimeRange={inTimeRange}
              todayCount={todayCount}
              dailyLimit={dailyLimit}
              minAmount={minAmount}
              maxAmount={maxAmount}
            />
          </div>

          {/* 右列：操作层（金额输入卡片 + 银行卡选择 + 主按钮） */}
          <div className="space-y-5">
            {/* 金额输入区 + 费用摘要浮层 */}
            {/* 依据：03.5.1-提现页.md 第4.2节 - 摘要浮层在金额输入卡片内 */}
            <Card padding="lg" className="bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl space-y-4">
              {/* 金额选择器 */}
              <AmountSelector
                type="withdraw"
                presets={quickAmounts}
                minAmount={minAmount}
                maxAmount={Math.min(maxAmount, availableBalance)}
                value={selectedAmount}
                onChange={setSelectedAmount}
                customValue={customAmount}
                onCustomChange={setCustomAmount}
                showAllButton
                availableBalance={availableBalance}
                onWithdrawAll={handleWithdrawAll}
                label={t('label.amount')}
                customLabel={t('label.custom_amount')}
                error={amountError}
              />

              {/* 费用摘要浮层（在金额输入卡片内） */}
              {/* 依据：03.5.1-提现页.md 第4.4节 - 摘要浮层 glass 或 bg-white/70 backdrop-blur-xl */}
              <FeeCalculator
                amount={finalAmount}
                feePercent={feePercent}
                asOverlay
              />
            </Card>

            {/* 银行卡选择（横向滚动） */}
            {/* 依据：03.5.1-提现页.md 第4.5-4.6节 */}
            <Card padding="lg" className="bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl">
              <BankCardSelector
                cards={bankCards}
                value={selectedCardId}
                onChange={setSelectedCardId}
                onAddCard={handleAddBankCard}
                isLoading={isBankCardsLoading}
                maxCount={bankCardsMaxCount}
                canAdd={bankCardsCanAdd}
                label={t('label.bank')}
              />
            </Card>

            {/* 主按钮 */}
            {/* 依据：03.5.1-提现页.md 第4.4节 - bg-primary-500 shadow-glow-sm */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="h-14 rounded-2xl btn-gradient text-lg font-bold tracking-wide"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                  {t('btn.processing')}
                </>
              ) : (
                <>
                  <RiShieldCheckLine className="w-5 h-5 mr-2" />
                  {t('btn.withdraw')}
                </>
              )}
            </Button>

            {/* 社区分享入口 */}
            <m.button
              type="button"
              onClick={() => router.push('/community/create')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-500 hover:text-primary-600 transition-colors rounded-xl hover:bg-primary-50/30"
            >
              <RiChat3Line className="size-4" />
              {t('community.share_withdraw')}
            </m.button>

            {/* 非时间窗口/次数用尽提示 */}
            {/* 依据：03.5.1-提现页.md 第3.4节 - 状态穷举表 */}
            {!inTimeRange && (
              <div className="text-center text-sm text-red-500">
                {t('tip.withdraw_outside_time')}
              </div>
            )}
            {todayCount >= dailyLimit && inTimeRange && (
              <div className="text-center text-sm text-red-500">
                {t('tip.withdraw_limit_reached')}
              </div>
            )}
          </div>
        </div>

        {/* 提示文案 - 置于页面底部 */}
        {tips && (
          <div className="max-w-5xl mx-auto mt-5">
            <TipsCard htmlContent={tips} />
          </div>
        )}
      </div>

      {/* 门槛未满足弹窗 */}
      {/* 依据：03.5.1-提现页.md 第2.5节 - dialog.withdraw_threshold_* */}
      <ConfirmDialog
        open={showThresholdDialog}
        onOpenChange={setShowThresholdDialog}
        title={t('dialog.withdraw_threshold_title')}
        description={t('dialog.withdraw_threshold_msg')}
        confirmText={t('btn.view_products')}
        cancelText={t('btn.cancel')}
        onConfirm={handleThresholdConfirm}
      />

      {/* 绑卡引导弹窗 */}
      {/* 依据：03.5.1-提现页.md 第6.6节 - ConfirmDialog */}
      <ConfirmDialog
        open={showBindCardDialog}
        onOpenChange={setShowBindCardDialog}
        title={t('dialog.bind_card_first')}
        description={t('dialog.bind_card_first_msg')}
        confirmText={t('btn.bind_card')}
        cancelText={t('btn.cancel')}
        onConfirm={handleBindCardConfirm}
      />
    </div>
  );
}

// ============================================
// 骨架屏组件
// ============================================

/**
 * 提现页骨架屏
 * 依据：03.5.1-提现页.md 第7.1-7.2节
 */
function WithdrawPageSkeleton() {
  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航骨架 */}
      <div className="h-14 flex items-center justify-between px-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* 依据：03.5.1-提现页.md 第4.3节 - 电脑端两列布局 */}
      <div className="px-4 py-5">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
          {/* 左列骨架 */}
          <div className="space-y-5">
            {/* 余额卡片骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-3">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-10" />
              <Skeleton className="w-40 h-4" />
            </div>

            {/* 提示卡片骨架 */}
            <Skeleton className="w-full h-16 rounded-2xl" />

            {/* 限制提示骨架 */}
            <Skeleton className="w-full h-28 rounded-2xl" />
          </div>

          {/* 右列骨架 */}
          <div className="space-y-5">
            {/* 金额输入区骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
              <Skeleton className="w-24 h-5" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="flex-1 h-12 rounded-xl" />
                ))}
              </div>
              <Skeleton className="w-full h-12 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-xl" />
            </div>

            {/* 银行卡骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-3">
              <Skeleton className="w-20 h-5" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="w-36 h-24 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* 按钮骨架 */}
            <Skeleton className="w-full h-14 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
