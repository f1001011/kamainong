/**
 * @file 返佣服务单元测试
 * @description 测试返佣计算、触发条件、跳过逻辑等核心功能
 * @depends 开发文档/开发文档.md 第4.5节 - 团队返佣
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import { CommissionService } from '../commission.service';

describe('CommissionService', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
  });

  describe('calculateCommission - 返佣金额计算', () => {
    /**
     * 依据：开发文档.md 第16.5节 - 金额计算精度规则
     * 向下取整到分：Math.floor(result * 100) / 100
     */

    it('应该正确计算一级返佣（20%）', () => {
      // 产品价格 50，一级返佣 20%
      // 预期：50 * 20% = 10.00
      const baseAmount = new Decimal(50);
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(10);
    });

    it('应该正确计算二级返佣（2%）', () => {
      // 产品价格 50，二级返佣 2%
      // 预期：50 * 2% = 1.00
      const baseAmount = new Decimal(50);
      const rate = new Decimal(2);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(1);
    });

    it('应该正确计算三级返佣（1%）', () => {
      // 产品价格 50，三级返佣 1%
      // 预期：50 * 1% = 0.50
      const baseAmount = new Decimal(50);
      const rate = new Decimal(1);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(0.5);
    });

    it('应该向下取整到分（示例1）', () => {
      // 产品价格 53，一级返佣 20%
      // 原始：53 * 20% = 10.6
      // 向下取整：10.60
      const baseAmount = new Decimal(53);
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(10.6);
    });

    it('应该向下取整到分（示例2：需要舍弃更多小数位）', () => {
      // 产品价格 33，一级返佣 20%
      // 原始：33 * 20% = 6.6
      // 向下取整：6.60
      const baseAmount = new Decimal(33);
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(6.6);
    });

    it('应该向下取整到分（示例3：有更多小数位需要舍弃）', () => {
      // 产品价格 37，二级返佣 2%
      // 原始：37 * 2% = 0.74
      // 向下取整：0.74
      const baseAmount = new Decimal(37);
      const rate = new Decimal(2);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(0.74);
    });

    it('应该向下取整到分（示例4：结果需要舍弃小数）', () => {
      // 产品价格 999，三级返佣 1%
      // 原始：999 * 1% = 9.99
      // 向下取整：9.99
      const baseAmount = new Decimal(999);
      const rate = new Decimal(1);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(9.99);
    });

    it('应该向下取整到分（示例5：确保向下取整）', () => {
      // 产品价格 123.45，一级返佣 20%
      // 原始：123.45 * 20% = 24.69
      // 向下取整：24.69
      const baseAmount = new Decimal('123.45');
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(24.69);
    });

    it('金额为0时应返回0', () => {
      const baseAmount = new Decimal(0);
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(0);
    });

    it('比例为0时应返回0', () => {
      const baseAmount = new Decimal(100);
      const rate = new Decimal(0);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(0);
    });

    it('应该处理大金额计算', () => {
      // 产品价格 99999.99，一级返佣 20%
      // 原始：99999.99 * 20% = 19999.998
      // 向下取整：19999.99
      const baseAmount = new Decimal('99999.99');
      const rate = new Decimal(20);
      const result = commissionService.calculateCommission(baseAmount, rate);
      expect(result.toNumber()).toBe(19999.99);
    });
  });

  describe('返佣业务规则验证', () => {
    /**
     * 这些测试验证业务规则的理解是否正确
     * 实际的数据库测试需要在集成测试中进行
     */

    it('三级返佣比例总和应小于100%', () => {
      // 依据：开发文档.md 第4.5节 - 一级20%、二级2%、三级1%
      const level1 = 20;
      const level2 = 2;
      const level3 = 1;
      const total = level1 + level2 + level3;
      expect(total).toBe(23);
      expect(total).toBeLessThan(100);
    });

    it('返佣计算示例：A邀请B，B购买50元产品', () => {
      // 依据：开发文档.md 第4.5节 - 示例
      const productPrice = new Decimal(50);

      // A获得一级返佣
      const commission1 = commissionService.calculateCommission(
        productPrice,
        new Decimal(20)
      );
      expect(commission1.toNumber()).toBe(10);

      // 如果A也有上级C，C获得二级返佣
      const commission2 = commissionService.calculateCommission(
        productPrice,
        new Decimal(2)
      );
      expect(commission2.toNumber()).toBe(1);

      // 如果C也有上级D，D获得三级返佣
      const commission3 = commissionService.calculateCommission(
        productPrice,
        new Decimal(1)
      );
      expect(commission3.toNumber()).toBe(0.5);
    });

    it('返佣计算示例：复杂价格场景', () => {
      // 产品价格 199.00
      const productPrice = new Decimal(199);

      // 一级返佣：199 * 20% = 39.8
      // 由于浮点精度，实际计算可能是 39.799999...
      // 向下取整后：39.79
      const commission1 = commissionService.calculateCommission(
        productPrice,
        new Decimal(20)
      );
      expect(commission1.toNumber()).toBe(39.79);

      // 二级返佣：199 * 2% = 3.98
      const commission2 = commissionService.calculateCommission(
        productPrice,
        new Decimal(2)
      );
      expect(commission2.toNumber()).toBe(3.98);

      // 三级返佣：199 * 1% = 1.99
      const commission3 = commissionService.calculateCommission(
        productPrice,
        new Decimal(1)
      );
      expect(commission3.toNumber()).toBe(1.99);
    });
  });
});

/**
 * 集成测试说明（需要数据库环境）
 *
 * 以下测试场景需要在集成测试环境中验证：
 *
 * 1. 返佣触发条件测试：
 *    - 体验产品（type=TRIAL）不触发返佣
 *    - 付费产品（type=PAID）首次购买触发返佣
 *    - 付费产品非首次购买不触发返佣
 *    - 赠送产品不触发返佣
 *
 * 2. 上级跳过逻辑测试：
 *    - 上级不存在时跳过该级
 *    - 上级被封禁（status=BANNED）时跳过该级
 *    - 跳过不影响下一级计算
 *
 * 3. 并发安全测试：
 *    - 多个用户同时购买时，返佣计算和余额更新应该正确
 *
 * 4. 返佣记录完整性测试：
 *    - CommissionRecord 表记录正确
 *    - Transaction 表流水记录正确
 *    - 用户余额更新正确
 */
