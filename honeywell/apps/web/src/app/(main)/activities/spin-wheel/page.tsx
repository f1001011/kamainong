/**
 * @file 转盘抽奖页面
 * @description 幸运转盘活动，CSS动画旋转 + 中奖弹窗 + 礼花效果
 * @route /activities/spin-wheel
 *
 * 设计要点：
 * - 视觉震撼的CSS转盘，12个扇区交替配色
 * - 剩余次数展示
 * - 3~5秒旋转动画，ease-out减速
 * - 中奖弹窗 + confetti
 * - 今日抽奖历史
 * - "如何获取次数"说明区域
 */

'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiStarFill,
  RiGiftFill,
  RiQuestionLine,
  RiHistoryLine,
  RiCloseLine,
  RiCoinsFill,
  RiAddCircleLine,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { useConfetti } from '@/components/effects/confetti';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import api from '@/lib/api';

/** 奖品扇区（前端渲染用） */
interface Prize {
  id: number;
  label: string;
  amount: number;
}

/** 转盘状态数据 */
interface SpinStatus {
  remainingChances: number;
  maxChances: number;
  maxDaily?: number;
  todayHistory: Array<{
    id: number;
    prizeLabel: string;
    amount: number;
    createdAt: string;
  }>;
}

/** API 返回的奖品原始数据 */
interface ApiPrize {
  id: number;
  name: string;
  amount: string;
  sortOrder: number;
}

/** 抽奖结果 */
interface SpinResult {
  prizeIndex: number;
  prize: { id: number; name: string; amount: string };
  remainingChances: number;
}

/** 转盘扇区配色 - 翡翠绿+香槟金交替 */
const SEGMENT_COLORS = [
  { bg: 'var(--color-primary-50)', text: 'var(--color-primary-700)' },
  { bg: 'var(--color-gold-50)', text: 'var(--color-dark-800)' },
];

/**
 * 转盘抽奖页面
 */
export default function SpinWheelPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();
  const { triggerBurst } = useConfetti();

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winPrize, setWinPrize] = useState<Prize | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // 获取转盘状态
  const { data: status, isLoading: statusLoading } = useQuery<SpinStatus>({
    queryKey: ['spin-wheel-status'],
    queryFn: async () => {
      const res = await api.get<SpinStatus>('/spin-wheel/status');
      return { ...res, todayHistory: res.todayHistory ?? [], maxChances: res.maxChances ?? res.maxDaily ?? 5 };
    },
  });

  // 获取奖品列表（API 直接返回数组，需映射字段）
  const { data: prizes = [] } = useQuery<Prize[]>({
    queryKey: ['spin-wheel-prizes'],
    queryFn: async () => {
      const list = await api.get<ApiPrize[]>('/spin-wheel/prizes');
      return (list ?? []).map((p) => ({
        id: p.id,
        label: p.name,
        amount: Number(p.amount),
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 30;

  // 执行抽奖
  const spinMutation = useMutation({
    mutationFn: () => api.post<SpinResult>('/spin-wheel/spin'),
    onSuccess: (result) => {
      const targetIndex = result.prizeIndex;
      // extraSpins 必须为整数，否则 extraSpins*360 会引入额外角度偏移，导致指针停在错误扇区
      const extraSpins = 5 + Math.floor(Math.random() * 4);
      // 在目标扇区内添加随机偏移，避免每次都停在正中心（±30%扇区宽度）
      const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;
      const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2 + jitter);
      const currentEffective = currentRotation % 360;
      const delta = (targetAngle - currentEffective + 360) % 360;
      const totalRotation = currentRotation + extraSpins * 360 + delta;

      setCurrentRotation(totalRotation);

      setTimeout(() => {
        setIsSpinning(false);
        const mappedPrize: Prize = {
          id: result.prize.id,
          label: result.prize.name,
          amount: Number(result.prize.amount),
        };
        setWinPrize(mappedPrize);
        setShowWinModal(true);
        if (mappedPrize.amount > 0) {
          triggerBurst();
        }
        queryClient.invalidateQueries({ queryKey: ['spin-wheel-status'] });
      }, 4000);
    },
    onError: () => {
      setIsSpinning(false);
    },
  });

  const handleSpin = () => {
    if (isSpinning || !status || status.remainingChances <= 0) return;
    setIsSpinning(true);
    spinMutation.mutate();
  };

  if (statusLoading || !status) return <SpinSkeleton />;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-primary-50/80 via-primary-50/40 to-white overflow-hidden">
        <FloatingOrbs variant="activities" />

        {/* 顶部导航 */}
        <header className="sticky top-0 z-30">
          <div
            style={{
              background: 'rgba(250,250,247,0.88)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-primary-100/80 active:scale-95 transition-all"
                aria-label={t('btn.back')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
              </button>
              <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
                {t('spin.title')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <div className="relative z-10 px-4 pt-4 pb-28">
          {/* 剩余次数 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: -10 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRINGS.gentle}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary-200/50 shadow-[0_2px_12px_rgba(var(--color-primary-rgb),0.1)]">
              <RiStarFill className="size-5 text-primary-500" />
              <span className="text-sm font-semibold text-neutral-700">
                {t('spin.chances')}:
              </span>
              <span className="text-lg font-bold text-primary-600 tabular-nums">
                {status.remainingChances}
              </span>
              <span className="text-sm text-neutral-400">/ {status.maxChances}</span>
            </div>
          </m.div>

          {/* 转盘区域 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
            className="relative mx-auto mb-8"
            style={{ maxWidth: 340 }}
          >
            {/* 外圈装饰 - 灯泡效果 */}
            <div className="absolute inset-0 -m-4 rounded-full border-[6px] border-primary-200/40">
              <div className="absolute inset-0 rounded-full" style={{
                background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.1) 0%, transparent 70%)',
              }} />
            </div>

            {/* 指针（顶部三角形） */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary-500 drop-shadow-md" />
            </div>

            {/* 转盘主体 */}
            <div
              ref={wheelRef}
              className="relative aspect-square rounded-full overflow-hidden shadow-[0_8px_32px_rgba(var(--color-gold-rgb),0.25),inset_0_0_0_4px_rgba(var(--color-gold-rgb),0.3)]"
              style={{
                transform: `rotate(${currentRotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {/* SVG转盘扇区 */}
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {prizes.map((prize, index) => {
                  const startAngle = index * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);
                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                  const x1 = 150 + 150 * Math.cos(startRad);
                  const y1 = 150 + 150 * Math.sin(startRad);
                  const x2 = 150 + 150 * Math.cos(endRad);
                  const y2 = 150 + 150 * Math.sin(endRad);
                  const colors = SEGMENT_COLORS[index % 2];
                  const textAngle = startAngle + segmentAngle / 2;
                  const textRad = (textAngle - 90) * (Math.PI / 180);
                  const textR = 100;
                  const tx = 150 + textR * Math.cos(textRad);
                  const ty = 150 + textR * Math.sin(textRad);

                  return (
                    <g key={prize.id}>
                      <path
                        d={`M 150 150 L ${x1} ${y1} A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={colors.bg}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={colors.text}
                        fontSize="12"
                        fontWeight="bold"
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      >
                        {prize.amount > 0
                          ? formatCurrency(prize.amount, config, { decimals: 0 })
                          : t('spin.thanks')}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 中心按钮 */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || status.remainingChances <= 0}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 rounded-full bg-gradient-to-b from-primary-400 to-primary-600 text-white font-bold text-base shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.4),inset_0_2px_0_rgba(255,255,255,0.2)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {isSpinning ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('spin.go')
              )}
            </button>
          </m.div>

          {/* 今日抽奖历史 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <RiHistoryLine className="size-5 text-primary-500" />
              <h3 className="text-base font-semibold text-neutral-800">
                {t('spin.today_history')}
              </h3>
            </div>

            {status.todayHistory.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">
                {t('spin.no_history')}
              </p>
            ) : (
              <div className="space-y-2">
                {status.todayHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-neutral-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <RiGiftFill className={`size-4 ${record.amount > 0 ? 'text-primary-500' : 'text-neutral-300'}`} />
                      <span className="text-sm text-neutral-700">{record.prizeLabel}</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${record.amount > 0 ? 'text-primary-600' : 'text-neutral-400'}`}>
                      {record.amount > 0 ? `+${formatCurrency(record.amount, config)}` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </m.div>

          {/* 如何获取次数 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <RiQuestionLine className="size-5 text-primary-500" />
              <h3 className="text-base font-semibold text-neutral-800">
                {t('spin.how_to_get')}
              </h3>
            </div>
            <div className="space-y-3">
              <ChanceMethod
                icon={<RiCoinsFill className="size-4 text-primary-500" />}
                title={t('spin.method_recharge')}
                desc={t('spin.method_recharge_desc')}
              />
              <ChanceMethod
                icon={<RiAddCircleLine className="size-4 text-blue-500" />}
                title={t('spin.method_invite')}
                desc={t('spin.method_invite_desc')}
              />
            </div>
          </m.div>
        </div>

        {/* 中奖弹窗 */}
        <AnimatePresence>
          {showWinModal && winPrize && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowWinModal(false)}
            >
              <m.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={SPRINGS.bouncy}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[85%] max-w-sm rounded-3xl bg-gradient-to-b from-primary-50 via-white to-primary-50 p-6 shadow-[0_20px_60px_rgba(var(--color-primary-rgb),0.3)] text-center"
              >
                <button
                  onClick={() => setShowWinModal(false)}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-neutral-100/80 transition-colors"
                >
                  <RiCloseLine className="size-5 text-neutral-400" />
                </button>

                <m.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...SPRINGS.bouncy, delay: 0.15 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-[0_8px_24px_rgba(var(--color-primary-rgb),0.3)]"
                >
                  <RiGiftFill className="size-10 text-white" />
                </m.div>

                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  {winPrize.amount > 0
                    ? t('spin.congratulations')
                    : t('spin.thanks_msg')}
                </h3>

                {winPrize.amount > 0 ? (
                  <m.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRINGS.gentle, delay: 0.25 }}
                    className="text-3xl font-black text-primary-600 mb-2"
                  >
                    +{formatCurrency(winPrize.amount, config)}
                  </m.p>
                ) : (
                  <p className="text-base text-neutral-500 mb-2">
                    {t('spin.try_again')}
                  </p>
                )}

                <p className="text-sm text-neutral-400 mb-5">{winPrize.label}</p>

                <m.button
                  onClick={() => setShowWinModal(false)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.3)]"
                  whileTap={{ scale: 0.96 }}
                  transition={SPRINGS.snappy}
                >
                  {t('btn.confirm')}
                </m.button>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

/** 获取次数方法组件 */
function ChanceMethod({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/50">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-700">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/** 加载骨架屏 */
function SpinSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/80 via-primary-50/40 to-white">
      <header className="sticky top-0 z-30" style={{ background: 'rgba(250,250,247,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-10 h-10 bg-primary-200/40 rounded-lg animate-pulse" />
          <div className="w-40 h-5 bg-primary-200/40 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="px-4 pt-4 flex flex-col items-center">
        <div className="h-10 w-48 bg-primary-100/60 rounded-full animate-pulse mb-6" />
        <div className="w-72 h-72 rounded-full bg-primary-100/40 animate-pulse mb-8" />
        <div className="w-full h-40 bg-white rounded-2xl animate-pulse mb-4" />
        <div className="w-full h-48 bg-white rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
