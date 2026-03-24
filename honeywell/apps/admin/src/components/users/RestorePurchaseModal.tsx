/**
 * @file 恢复限购弹窗
 * @description 恢复用户产品的购买资格
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md 第10.3节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Typography,
  Space,
  Alert,
  Spin,
  Tag,
  App,
} from 'antd';
import { RiRefreshLine, RiInformationLine } from '@remixicon/react';
import { restoreUserPurchase, fetchUserPurchasedProducts } from '@/services/users';
import type { UserDetail, UserProductPurchase } from '@/types/users';

const { Text } = Typography;

export interface RestorePurchaseModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserDetail | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  productId: number;
}

/**
 * 恢复限购弹窗
 */
export function RestorePurchaseModal({
  open,
  user,
  onClose,
  onSuccess,
}: RestorePurchaseModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<UserProductPurchase[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const { message } = App.useApp();

  // 加载用户已购买产品
  useEffect(() => {
    if (open && user) {
      setProductsLoading(true);
      fetchUserPurchasedProducts(user.id)
        .then((res) => {
          // 只显示已购买过的产品（购买次数 > 0）
          const purchased = (res.list || []).filter((p) => p.purchaseCount > 0);
          setProducts(purchased);
        })
        .catch((error) => {
          console.error('加载用户已购买产品失败:', error);
        })
        .finally(() => {
          setProductsLoading(false);
        });
    }
  }, [open, user]);

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  // 提交处理
  const handleSubmit = async () => {
    if (!user) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      await restoreUserPurchase(user.id, values.productId);

      const selectedProduct = products.find((p) => p.productId === values.productId);
      message.success(`已恢复产品「${selectedProduct?.productName || ''}」的购买资格`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('恢复限购失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <RiRefreshLine size={20} />
          <span>恢复限购 - 用户 {user.phone}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确定恢复"
      cancelText="取消"
      width={480}
      destroyOnHidden
    >
      <Spin spinning={productsLoading}>
        <Form form={form} layout="vertical">
          {/* 产品选择 */}
          <Form.Item
            name="productId"
            label="选择产品"
            rules={[{ required: true, message: '请选择要恢复限购的产品' }]}
          >
            <Select
              placeholder="请选择产品"
              showSearch
              optionFilterProp="label"
              notFoundContent={
                products.length === 0 ? (
                  <Text type="secondary">用户未购买任何产品</Text>
                ) : undefined
              }
              options={products.map((product) => ({
                value: product.productId,
                label: (
                  <Space>
                    <span>{product.productName}</span>
                    <Text type="secondary">({product.productCode})</Text>
                    <Tag color={product.purchaseCount >= product.purchaseLimit ? 'orange' : 'blue'}>
                      已购买 {product.purchaseCount}/{product.purchaseLimit}
                    </Tag>
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          {/* 提示信息 */}
          <Alert
            message="恢复限购说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>仅显示用户已购买的产品</li>
                <li>每次操作仅恢复1次购买资格</li>
                <li>恢复后用户可再次购买该产品</li>
              </ul>
            }
            type="info"
            showIcon
            icon={<RiInformationLine size={16} />}
          />
        </Form>
      </Spin>
    </Modal>
  );
}

export default RestorePurchaseModal;
