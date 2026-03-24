/**
 * @file 修改密码页面
 * @description 管理员修改自己的登录密码
 */

'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, App, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { RiLockPasswordLine } from '@remixicon/react';
import { resetAdminPassword } from '@/services/admins';
import { useAuthStore } from '@/stores/admin';

const { Text } = Typography;

interface PasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const [form] = Form.useForm<PasswordFormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const admin = useAuthStore((s) => s.admin);

  const handleSubmit = async (values: PasswordFormValues) => {
    if (!admin?.id) {
      message.error('未获取到管理员信息，请重新登录');
      return;
    }

    setLoading(true);
    try {
      await resetAdminPassword(admin.id, values.newPassword);
      message.success('密码修改成功');
      form.resetFields();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '密码修改失败';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: '修改密码',
        breadcrumb: {
          items: [
            { title: '系统设置' },
            { title: '修改密码' },
          ],
        },
      }}
    >
      <Card
        style={{ maxWidth: 520, margin: '0 auto' }}
        styles={{ body: { padding: '32px 40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <RiLockPasswordLine size={48} style={{ color: '#1677ff', marginBottom: 12 }} />
          <div>
            <Text type="secondary">
              当前账号：<Text strong>{admin?.username || '-'}</Text>
            </Text>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 32, message: '密码最多32个字符' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
                message: '密码必须包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位，需包含字母和数字）" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
}
