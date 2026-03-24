/**
 * @file 连单奖励活动页 - 2026高端美学升级版
 * @description FE-21 - 游戏化的成就收集系统，鼓励用户购买多产品组合
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学
 * @route /activities/collection
 * 
 * 2026高端美学升级：
 * - 深色Hero头部 + 渐变过渡
 * - 浮动光球装饰
 * - 毛玻璃卡片系统
 * - 高级感阶梯展示
 */

'use client';

import { useRouter } from 'next/navigation';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useCollectionActivity } from '@/hooks/use-collection-activity';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import { RiArrowLeftSLine, RiAlertLine, RiTrophyFill } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation';

// 子组件导入
import {
  PrerequisiteCard,
  CollectionShowcase,
  CollectionTierList,
  RulesSection,
  CollectionSkeleton,
} from './_components';

/**
 * 连单奖励活动页 - 2026高端美学版
 * @description 依据：03.11.4-连单奖励活动页.md 第5.11节 - 页面组件
 * 
 * 页面结构（升级版）：
 * 1. 深色Hero头部 - 带装饰光晕 + 活动标题
 * 2. 前置条件卡片 - 毛玻璃风格
 * 3. 已购产品收藏展示 - 高级画廊
 * 4. 奖励阶梯列表 - 发光卡片
 * 5. 活动规则说明 - 可折叠毛玻璃
 */
export default function CollectionActivityPage() {
  const t = useText();
  const router = useRouter();
  const { isAnimationEnabled } = useAnimationConfig();

  // 获取活动数据
  const { data, isLoading, isError, error, refetch } = useCollectionActivity();

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        {/* 深色Hero头部骨架 */}
        <div className="relative overflow-hidden px-4 pt-12 pb-16" style={{
          background: 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-dark-900) 25%, var(--color-dark-800) 50%, var(--color-dark-700) 75%, var(--color-dark-950) 100%)',
        }}>
          <div className="max-w-2xl mx-auto relative z-10">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/8 border border-white/10 mb-6"
            >
              <RiArrowLeftSLine className="w-6 h-6 text-white/60" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-40 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-4 w-56 bg-white/8 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="h-6 -mt-6 relative z-[1] rounded-t-3xl bg-gradient-to-b from-primary-50/60 via-white to-white" />

        <main className="px-4 pb-6 max-w-2xl mx-auto -mt-1">
          <CollectionSkeleton />
        </main>
      </div>
    );
  }

  // 错误状态
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        {/* 深色Hero头部 */}
        <div className="relative overflow-hidden px-4 pt-12 pb-16" style={{
          background: 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-dark-900) 25%, var(--color-dark-800) 50%, var(--color-dark-700) 75%, var(--color-dark-950) 100%)',
        }}>
          <div className="max-w-2xl mx-auto relative z-10">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/8 hover:bg-white/12 border border-white/10 transition-colors mb-6"
            >
              <RiArrowLeftSLine className="w-6 h-6 text-white/60" />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('page.activity_collection', 'مكافأة المجموعة')}
            </h1>
          </div>
        </div>
        <div className="h-6 -mt-6 relative z-[1] rounded-t-3xl bg-gradient-to-b from-primary-50/60 via-white to-white" />

        <main className="px-4 pb-6 max-w-2xl mx-auto -mt-1">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-error-50 flex items-center justify-center mb-4 shadow-soft">
              <RiAlertLine className="w-8 h-8 text-error-500" />
            </div>
            <p className="text-neutral-500 mb-4">
              {error?.message || t('error.load_failed', 'خطأ في التحميل')}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t('btn.retry', 'إعادة المحاولة')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50 overflow-hidden">
        {/* 浮动光球装饰 */}
        <FloatingOrbs variant="activities" />

        {/* ========================================
           深色Hero头部区域 - 大尺寸高冲击力设计
           ======================================== */}
        <div className="relative">
          <div className="relative overflow-hidden px-4 pt-12 pb-16" style={{
            background: 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-dark-900) 25%, var(--color-dark-800) 50%, var(--color-dark-700) 75%, var(--color-dark-950) 100%)',
          }}>
            {/* 大型装饰光晕 - 右上角 */}
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-25 blur-[80px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(var(--color-primary-rgb),0.5) 0%, transparent 60%)' }}
            />
            {/* 左下角光晕 */}
            <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-full opacity-20 blur-[60px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.6) 0%, transparent 60%)' }}
            />
            {/* 中心微弱光晕 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 rounded-full opacity-10 blur-[100px] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(var(--color-gold-rgb),0.5) 0%, transparent 60%)' }}
            />
            {/* 闪光流动效果 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer-flow 4s ease-in-out infinite',
                }}
              />
            </div>
            {/* 顶部渐变边框 */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(var(--color-gold-rgb),0.3) 50%, transparent 90%)' }}
            />

            <div className="relative z-10 max-w-2xl mx-auto">
              {/* 返回按钮 */}
              <m.button
                initial={isAnimationEnabled ? { opacity: 0, x: -10 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                transition={SPRINGS.gentle}
                onClick={handleBack}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/8 hover:bg-white/12 backdrop-blur-sm border border-white/10 transition-colors mb-6"
              >
                <RiArrowLeftSLine className="w-6 h-6 text-white/60" />
              </m.button>

              {/* 活动标题区 - 更大更有冲击力 */}
              <m.div
                initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRINGS.gentle}
              >
                {/* 大型奖杯图标 */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.2) 0%, rgba(var(--color-gold-rgb),0.1) 100%)',
                      border: '1px solid rgba(var(--color-primary-rgb),0.2)',
                    }}
                  >
                    <RiTrophyFill className="w-7 h-7 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">{data.activityName}</h1>
                    {data.activityDesc && (
                      <p className="text-sm text-white/40 mt-1 leading-relaxed">{data.activityDesc}</p>
                    )}
                  </div>
                </div>
              </m.div>
            </div>
          </div>
          {/* 底部弧形过渡 */}
          <div className="h-6 -mt-6 relative z-[1] rounded-t-3xl bg-gradient-to-b from-primary-50/60 via-white to-white" />
        </div>

        {/* ========================================
           主内容区
           ======================================== */}
        <main className="relative z-10 px-4 max-w-2xl mx-auto -mt-1 space-y-5 pb-24">
          {/* 前置条件卡片 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.05 }}
          >
            <PrerequisiteCard prerequisite={data.prerequisite} />
          </m.div>

          {/* 已购产品收藏展示 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.1 }}
          >
            <CollectionShowcase purchasedProducts={data.purchasedProducts} />
          </m.div>

          {/* 奖励阶梯列表（内部处理领取逻辑和庆祝动画） */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.15 }}
          >
            <CollectionTierList
              tiers={data.tiers}
              prerequisiteMet={data.prerequisite.isMet}
            />
          </m.div>

          {/* 活动规则说明 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.2 }}
          >
            <RulesSection />
          </m.div>
        </main>
      </div>
    </LazyMotion>
  );
}
