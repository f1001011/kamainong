/**
 * @file 前置条件卡片组件 - 2026高端美学升级版
 * @description 显示参与活动的前置条件状态（已达成/未达成），毛玻璃风格
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.4节
 */

'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { Button } from '@/components/ui/button';
import { RiCheckLine, RiShieldCheckLine, RiShoppingCartLine } from '@remixicon/react';

/**
 * 前置条件数据
 */
interface Prerequisite {
  description: string;
  isMet: boolean;
}

/**
 * 前置条件卡片组件属性
 */
interface PrerequisiteCardProps {
  prerequisite: Prerequisite;
}

/**
 * 前置条件卡片组件 - 2026高端美学版
 * @description 依据：03.11.4-连单奖励活动页.md 第4.4节 - 前置条件区设计
 * 
 * 设计特色：
 * - 已达成：渐变绿色背景，发光勾选图标
 * - 未达成：柔和琥珀色背景，引导按钮
 * - 毛玻璃质感
 */
export function PrerequisiteCard({ prerequisite }: PrerequisiteCardProps) {
  const t = useText();
  const router = useRouter();

  const isMet = prerequisite.isMet;

  if (isMet) {
    // ======== 已达成状态 - 优雅绿色确认卡片 ========
    return (
      <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br from-success-50 to-white border border-success-200/50 shadow-soft-sm">
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/15 flex items-center justify-center flex-shrink-0">
            <RiShieldCheckLine className="w-5 h-5 text-success-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-neutral-700">
                {t('collection.prerequisite_title', 'الشرط المسبق')}
              </span>
              <span className="text-xs font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-success-200/50">
                <RiCheckLine className="w-3 h-3" />
                {t('collection.prerequisite_met', 'تم استيفاء الشرط')}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{prerequisite.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // ======== 未达成状态 - 高端引导卡片（非警告色） ========
  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary-200/50 shadow-soft"
      style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fffbf5 100%)',
      }}
    >
      {/* 顶部装饰渐变条 */}
      <div className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--color-primary-400) 0%, var(--color-primary-500) 50%, var(--color-primary-600) 100%)' }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 购物图标 - 引导而非警告 */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.15) 0%, rgba(var(--color-primary-rgb),0.08) 100%)',
              border: '1px solid rgba(var(--color-primary-rgb),0.15)',
            }}
          >
            <RiShoppingCartLine className="w-5 h-5 text-primary-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[15px] text-neutral-800">
                {t('collection.prerequisite_title', 'الشرط المسبق')}
              </span>
              <span className="text-xs font-medium text-primary-600/70 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200/40">
                {t('collection.prerequisite_unmet', 'معلّق')}
              </span>
            </div>

            <p className="text-sm text-neutral-500 mb-3">
              {prerequisite.description}
            </p>

            {/* 引导按钮 - 渐变主色调 */}
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl btn-gradient transition-all"
            >
              {t('collection.go_products', 'عرض المنتجات')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
