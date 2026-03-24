/**
 * @file 修改密码页
 * @description 用户修改密码页面，修改成功后自动退出登录
 * @depends 开发文档/03-前端用户端/03.7.3-修改密码页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 * @depends 02.3-前端API接口清单.md - PUT /api/user/password
 * 
 * 2026高端美学设计要点：
 * - 银行级安全视觉感
 * - 大间距表单设计
 * - 密码强度指示器
 * - 修改成功自动退出
 */

'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { RiLockPasswordLine, RiShieldKeyholeLine } from '@remixicon/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useUserStore } from '@/stores/user';
import { cn } from '@/lib/utils';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

// 组件
import { ChangePasswordForm } from '@/components/settings';

/**
 * 修改密码请求参数
 * 依据：02.3-前端API接口清单.md 第3.3节 - PUT /api/user/password
 */
interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 修改密码页面
 * @description 用户修改密码，修改成功后自动退出登录
 * 
 * 业务规则：
 * 1. 旧密码正确性校验
 * 2. 新密码必须符合规则（字母+数字≥8位）
 * 3. 新密码不能与旧密码相同
 * 4. 修改成功后自动退出登录，跳转登录页
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { logout: logoutStore } = useUserStore();

  /**
   * 修改密码 Mutation
   * 依据：02.3-前端API接口清单.md 第3.3节 - PUT /api/user/password
   */
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.put<void>('/user/password', data as unknown as Record<string, unknown>),
    onSuccess: () => {
      // 显示成功提示
      toast.success(t('toast.password_changed'));
      
      // 延迟执行退出登录，让用户看到成功提示
      setTimeout(() => {
        // 清除本地状态
        logoutStore();
        // 清除所有查询缓存
        queryClient.clear();
        // 跳转到登录页
        router.replace('/login');
      }, 1500);
    },
    onError: (error: Error & { code?: string }) => {
      // 根据错误码显示不同提示
      // 依据：02.3-前端API接口清单.md 第3.3节 - 错误码
      switch (error.code) {
        case 'OLD_PASSWORD_WRONG':
          toast.error(t('error.old_password_wrong'));
          break;
        case 'SAME_PASSWORD':
          toast.error(t('error.same_password'));
          break;
        case 'VALIDATION_ERROR':
          toast.error(t('error.password_validation'));
          break;
        default:
          toast.error(error.message || t('error.unknown'));
      }
    },
  });

  /**
   * 表单提交处理
   */
  const handleSubmit = async (data: ChangePasswordRequest) => {
    await changePasswordMutation.mutateAsync(data);
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        {/* 页面容器 */}
        <div className="min-h-screen bg-immersive">
          {/* 主内容区 */}
          <main className="md:pl-60">
            <m.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="px-4 py-6 space-y-5 max-w-lg mx-auto"
            >
              {/* 页面标题区 */}
              <m.div variants={listItemVariants} className="text-center mb-6">
                {/* 安全图标 */}
                <div className={cn(
                  'w-16 h-16 mx-auto mb-4 rounded-2xl',
                  'bg-gradient-to-br from-primary-100 to-primary-100',
                  'flex items-center justify-center'
                )}>
                  <RiShieldKeyholeLine className="w-8 h-8 text-primary-500" />
                </div>
                
                <h1 className="text-xl font-bold tracking-tight text-neutral-800 flex items-center justify-center gap-2">
                  <RiLockPasswordLine className="w-5 h-5 text-primary-500" />
                  {t('security.change_password')}
                </h1>
                <p className="text-sm text-neutral-400 mt-2">
                  {t('security.password_page_desc')}
                </p>
              </m.div>

              {/* 表单卡片 */}
              <m.section variants={listItemVariants}>
                <div className="bg-white rounded-2xl shadow-soft-md p-6">
                  <ChangePasswordForm
                    onSubmit={handleSubmit}
                    isSubmitting={changePasswordMutation.isPending}
                  />
                </div>
              </m.section>

              {/* 安全提示 */}
              <m.section variants={listItemVariants}>
                <div className={cn(
                  'bg-gold-50 rounded-xl p-4',
                  'border border-gold-200'
                )}>
                  <p className="text-sm text-gold-700 text-center">
                    {t('security.logout_notice')}
                  </p>
                </div>
              </m.section>

              {/* 底部安全间距（为底部导航预留空间） */}
              <div className="h-20 md:h-4" />
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
