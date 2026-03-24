/**
 * @file 登录页面
 * @description 后台管理系统登录入口，采用左右分栏布局
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第4节 - 认证与权限
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import {
  RiUserLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldCheckLine,
  RiDashboardLine,
  RiLineChartLine,
  RiTeamLine,
} from '@remixicon/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/admin';
import { post } from '@/utils/request';

const { Title, Text, Paragraph } = Typography;

/**
 * 主题色（Ant Design 默认蓝色）
 */
const PRIMARY_COLOR = '#1677ff';

/**
 * 登录表单字段
 */
interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 * @description 依据：02.4-后台API接口清单.md 第1.1节
 */
interface LoginResponse {
  token: string;
  admin: {
    id: number;
    username: string;
    nickname: string | null;
    isActive?: boolean;
    lastLoginAt?: string;
    lastLoginIp?: string;
    createdAt?: string;
  };
}

/**
 * 产品特性列表
 */
const FEATURES = [
  {
    icon: RiDashboardLine,
    title: '实时数据看板',
    description: '全面的数据可视化，业务状态一目了然',
  },
  {
    icon: RiLineChartLine,
    title: '高效运营管理',
    description: '订单、用户、资金全流程管理',
  },
  {
    icon: RiTeamLine,
    title: '多角色权限',
    description: '灵活的权限配置，安全的访问控制',
  },
];

/**
 * 登录页面组件
 * @description 采用左侧品牌区 + 右侧登录表单的分栏布局
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const { message } = App.useApp(); // 使用 App.useApp() 获取 message 实例
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 获取登录后跳转地址（来自中间件的 redirect 参数）
  const redirectUrl = searchParams.get('redirect') || '/';

  /**
   * 已登录用户重定向到仪表盘
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  /**
   * 处理登录
   */
  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    setShake(false);

    try {
      const response = await post<LoginResponse>('/auth/login', values);

      // 保存认证信息到 Zustand、localStorage 和 cookie
      setAuth(response.token, response.admin);

      message.success('登录成功，正在跳转...');

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error) {
      // 触发 shake 动画
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // 显示错误信息
      if (error instanceof Error) {
        setErrorMessage(error.message || '登录失败，请检查用户名和密码');
      } else {
        setErrorMessage('登录失败，请检查用户名和密码');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换密码显示/隐藏
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* 左侧品牌区域 - 60% 宽度 */}
      <div className="login-brand">
        <div className="login-brand-content">
          {/* Logo */}
          <div className="login-brand-logo">
            <div className="login-logo-icon">
              <RiShieldCheckLine size={40} color="#fff" />
            </div>
            <Title level={2} className="login-logo-text">
              lendlease
            </Title>
          </div>

          {/* 欢迎语 */}
          <div className="login-brand-welcome">
            <Title level={1} className="login-welcome-title">
              后台管理系统
            </Title>
            <Paragraph className="login-welcome-desc">
              高效、安全、专业的企业级管理平台
            </Paragraph>
          </div>

          {/* 产品特性 */}
          <div className="login-brand-features">
            {FEATURES.map((feature, index) => (
              <div key={index} className="login-feature-item">
                <div className="login-feature-icon">
                  <feature.icon size={24} color="#fff" />
                </div>
                <div className="login-feature-content">
                  <Text className="login-feature-title">{feature.title}</Text>
                  <Text className="login-feature-desc">
                    {feature.description}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 装饰元素 */}
        <div className="login-brand-decoration">
          <div className="decoration-circle decoration-circle-1"></div>
          <div className="decoration-circle decoration-circle-2"></div>
          <div className="decoration-circle decoration-circle-3"></div>
        </div>
      </div>

      {/* 右侧登录表单区域 - 40% 宽度 */}
      <div className="login-form-section">
        <div className={`login-form-container ${shake ? 'shake' : ''}`}>
          {/* 表单标题 */}
          <div className="login-form-header">
            {/* 移动端 Logo */}
            <div className="login-mobile-logo">
              <div
                className="login-logo-icon-small"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <RiShieldCheckLine size={24} color="#fff" />
              </div>
            </div>
            <Title level={3} className="login-form-title">
              欢迎登录
            </Title>
            <Text type="secondary" className="login-form-subtitle">
              请输入您的账号信息
            </Text>
          </div>

          {/* 错误提示 */}
          {errorMessage && (
            <div className="login-error-message">
              <Text type="danger">{errorMessage}</Text>
            </div>
          )}

          {/* 登录表单 */}
          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={
                  <RiUserLine size={18} className="login-input-icon" />
                }
                placeholder="请输入用户名"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                prefix={
                  <RiLockLine size={18} className="login-input-icon" />
                }
                suffix={
                  <span
                    onClick={togglePasswordVisibility}
                    className="login-password-toggle"
                  >
                    {showPassword ? (
                      <RiEyeOffLine size={18} />
                    ) : (
                      <RiEyeLine size={18} />
                    )}
                  </span>
                }
                placeholder="请输入密码"
                className="login-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16, marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-submit-btn"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          {/* 安全提示 */}
          <div className="login-security-notice">
            <RiShieldCheckLine size={14} className="login-security-icon" />
            <Text type="secondary" className="login-security-text">
              请勿在公共设备上保存密码
            </Text>
          </div>

          {/* 版权信息 */}
          <div className="login-footer">
            <Text type="secondary" className="login-copyright">
              © 2026 lendlease. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
