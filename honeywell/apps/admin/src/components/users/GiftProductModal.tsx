/**
 * @file 赠送产品弹窗
 * @description 向用户赠送产品
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md 第6.2节
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Form,
  Select,
  Typography,
  Space,
  Alert,
  Tag,
  Spin,
  App,
  Descriptions,
} from 'antd';
import { RiGiftLine, RiInformationLine } from '@remixicon/react';
import { giftProduct, fetchProducts, fetchUserPositions } from '@/services/users';
import { formatCurrency } from '@/utils/format';
import type { UserListItem, ProductItem } from '@/types/users';

const { Text } = Typography;

export interface GiftProductModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserListItem | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  productId: number;
}

/**
 * 赠送产品弹窗
 * @description 依据：04.3.1-用户列表页.md 第6.2节
 */
export function GiftProductModal({ open, user, onClose, onSuccess }: GiftProductModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<number>>(new Set());
  const [productsLoading, setProductsLoading] = useState(false);
  const { message } = App.useApp();

  // 监听选中的产品
  const selectedProductId = Form.useWatch('productId', form);
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // 加载产品列表和用户已购产品
  useEffect(() => {
    if (open && user) {
      setProductsLoading(true);
      Promise.all([fetchProducts(), fetchUserPositions(user.id)])
        .then(([productsRes, positionsRes]) => {
          setProducts(productsRes.list || []);
          const purchasedIds = new Set(
            (positionsRes.list || []).map((p) => p.productId)
          );
          setPurchasedProductIds(purchasedIds);
        })
        .catch((error) => {
          console.error('加载产品数据失败:', error);
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

      const result = await giftProduct(user.id, {
        productId: values.productId,
      });

      message.success(`产品赠送成功，订单号：${result.orderNo}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('赠送产品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 判断产品是否可选
  const isProductDisabled = (product: ProductItem): { disabled: boolean; reason: string } => {
    // 检查是否已购买
    if (purchasedProductIds.has(product.id)) {
      return { disabled: true, reason: '已购买' };
    }
    // 检查VIP等级要求（旧字段，仅当有值时校验）
    const requireLevel = product.requireVipLevel ?? 0;
    if (user && requireLevel > 0 && requireLevel > user.vipLevel) {
      return { disabled: true, reason: `需VIP${requireLevel}` };
    }
    return { disabled: false, reason: '' };
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <RiGiftLine size={20} />
          <span>赠送产品 - 用户 {user.phone}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确定赠送"
      cancelText="取消"
      width={520}
      destroyOnHidden
    >
      <Spin spinning={productsLoading}>
        <Form form={form} layout="vertical">
          {/* 产品选择 */}
          <Form.Item
            name="productId"
            label="选择产品"
            rules={[{ required: true, message: '请选择要赠送的产品' }]}
          >
            <Select
              placeholder="请选择产品"
              showSearch
              optionFilterProp="label"
              options={products.map((product) => {
                const { disabled, reason } = isProductDisabled(product);
                return {
                  value: product.id,
                  label: (
                    <Space>
                      <span>{product.name}</span>
                      <Text type="secondary">- {formatCurrency(product.price)}</Text>
                      {reason && (
                        <Tag color={disabled ? 'default' : 'blue'}>{reason}</Tag>
                      )}
                    </Space>
                  ),
                  disabled,
                };
              })}
            />
          </Form.Item>

          {/* 选中产品详情 */}
          {selectedProduct && (
            <div
              style={{
                marginBottom: 16,
                padding: 16,
                background: '#f0f7ff',
                borderRadius: 8,
              }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="产品名称">
                  {selectedProduct.name}
                </Descriptions.Item>
                <Descriptions.Item label="产品价格">
                  {formatCurrency(selectedProduct.price)}
                </Descriptions.Item>
                <Descriptions.Item label="每日收益">
                  {formatCurrency(selectedProduct.dailyIncome)}
                </Descriptions.Item>
                <Descriptions.Item label="收益周期">
                  {selectedProduct.cycleDays} 天
                </Descriptions.Item>
                <Descriptions.Item label="总收益">
                  {formatCurrency(selectedProduct.totalIncome)}
                </Descriptions.Item>
                {(selectedProduct.grantVipLevel ?? 0) > 0 && (
                  <Descriptions.Item label="赠送VIP等级">
                    VIP{selectedProduct.grantVipLevel}
                  </Descriptions.Item>
                )}
                {(selectedProduct.grantSvipLevel ?? 0) > 0 && (
                  <Descriptions.Item label="赠送SVIP等级">
                    SVIP{selectedProduct.grantSvipLevel}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}

          {/* 赠送规则说明 */}
          <Alert
            message="赠送规则说明"
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>赠送的产品占用限购名额</li>
                <li>赠送的产品计入提现门槛</li>
                <li>赠送的产品不触发返佣</li>
                <li>赠送的产品会授予对应VIP等级</li>
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

export default GiftProductModal;
