/**
 * @file 业务错误类测试
 * @description 测试 BusinessError 类和 Errors 快捷创建方法
 * @depends 开发文档/02-数据层/02.2-API规范.md 第4节 - 错误码规范
 */

import { describe, it, expect } from 'vitest';
import { BusinessError, Errors } from './errors';

describe('BusinessError 业务错误类', () => {
  it('应正确创建业务错误实例', () => {
    const error = new BusinessError('TEST_ERROR', '测试错误', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BusinessError);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('测试错误');
    expect(error.httpStatus).toBe(400);
    expect(error.name).toBe('BusinessError');
  });

  it('应使用默认 HTTP 状态码 400', () => {
    const error = new BusinessError('TEST_ERROR', '测试错误');

    expect(error.httpStatus).toBe(400);
  });

  it('应支持附加数据', () => {
    const error = new BusinessError('TEST_ERROR', '测试错误', 400, {
      field: 'username',
    });

    expect(error.extra).toEqual({ field: 'username' });
  });
});

describe('Errors 错误快捷创建', () => {
  describe('通用错误码', () => {
    it('unauthorized - 401', () => {
      const error = Errors.unauthorized();

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.httpStatus).toBe(401);
    });

    it('forbidden - 403', () => {
      const error = Errors.forbidden();

      expect(error.code).toBe('FORBIDDEN');
      expect(error.httpStatus).toBe(403);
    });

    it('notFound - 404', () => {
      const error = Errors.notFound('用户');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('用户不存在');
      expect(error.httpStatus).toBe(404);
    });

    it('validationError - 400', () => {
      const error = Errors.validationError('手机号格式错误');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('手机号格式错误');
      expect(error.httpStatus).toBe(400);
    });

    it('rateLimited - 429', () => {
      const error = Errors.rateLimited(30);

      expect(error.code).toBe('RATE_LIMITED');
      expect(error.httpStatus).toBe(429);
      expect(error.extra).toEqual({ retryAfter: 30 });
    });

    it('internalError - 500', () => {
      const error = Errors.internalError();

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.httpStatus).toBe(500);
    });
  });

  describe('用户相关错误码', () => {
    it('userNotFound - 404', () => {
      const error = Errors.userNotFound();

      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.httpStatus).toBe(404);
    });

    it('phoneAlreadyExists - 400', () => {
      const error = Errors.phoneAlreadyExists();

      expect(error.code).toBe('PHONE_ALREADY_EXISTS');
      expect(error.httpStatus).toBe(400);
    });

    it('userBanned - 403', () => {
      const error = Errors.userBanned();

      expect(error.code).toBe('USER_BANNED');
      expect(error.httpStatus).toBe(403);
    });

    it('invalidCredentials - 400', () => {
      const error = Errors.invalidCredentials();

      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('余额与产品相关错误码', () => {
    it('insufficientBalance - 400', () => {
      const error = Errors.insufficientBalance();

      expect(error.code).toBe('INSUFFICIENT_BALANCE');
      expect(error.httpStatus).toBe(400);
    });

    it('alreadyPurchased - 400', () => {
      const error = Errors.alreadyPurchased();

      expect(error.code).toBe('ALREADY_PURCHASED');
      expect(error.httpStatus).toBe(400);
    });

    it('vipLevelRequired - 400', () => {
      const error = Errors.vipLevelRequired(3);

      expect(error.code).toBe('VIP_LEVEL_REQUIRED');
      expect(error.message).toBe('需要VIP3等级');
      expect(error.httpStatus).toBe(400);
    });

    it('productNotFound - 404', () => {
      const error = Errors.productNotFound();

      expect(error.code).toBe('PRODUCT_NOT_FOUND');
      expect(error.httpStatus).toBe(404);
    });

    it('productInactive - 400', () => {
      const error = Errors.productInactive();

      expect(error.code).toBe('PRODUCT_INACTIVE');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('提现相关错误码', () => {
    it('withdrawThresholdNotMet - 400', () => {
      const error = Errors.withdrawThresholdNotMet();

      expect(error.code).toBe('WITHDRAW_THRESHOLD_NOT_MET');
      expect(error.httpStatus).toBe(400);
    });

    it('withdrawTimeInvalid - 400', () => {
      const error = Errors.withdrawTimeInvalid();

      expect(error.code).toBe('WITHDRAW_TIME_INVALID');
      expect(error.httpStatus).toBe(400);
    });

    it('withdrawLimitExceeded - 400', () => {
      const error = Errors.withdrawLimitExceeded();

      expect(error.code).toBe('WITHDRAW_LIMIT_EXCEEDED');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('银行卡相关错误码', () => {
    it('bankCardNotFound - 404', () => {
      const error = Errors.bankCardNotFound();

      expect(error.code).toBe('BANK_CARD_NOT_FOUND');
      expect(error.httpStatus).toBe(404);
    });

    it('bankCardRequired - 400', () => {
      const error = Errors.bankCardRequired();

      expect(error.code).toBe('BANK_CARD_REQUIRED');
      expect(error.httpStatus).toBe(400);
    });

    it('bankCardLimitExceeded - 400', () => {
      const error = Errors.bankCardLimitExceeded();

      expect(error.code).toBe('BANK_CARD_LIMIT_EXCEEDED');
      expect(error.httpStatus).toBe(400);
    });

    it('bankDisabled - 400', () => {
      const error = Errors.bankDisabled();

      expect(error.code).toBe('BANK_DISABLED');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('签到与活动相关错误码', () => {
    it('alreadySignedToday - 400', () => {
      const error = Errors.alreadySignedToday();

      expect(error.code).toBe('ALREADY_SIGNED_TODAY');
      expect(error.httpStatus).toBe(400);
    });

    it('signinWindowExpired - 400', () => {
      const error = Errors.signinWindowExpired();

      expect(error.code).toBe('SIGNIN_WINDOW_EXPIRED');
      expect(error.httpStatus).toBe(400);
    });

    it('rewardAlreadyClaimed - 400', () => {
      const error = Errors.rewardAlreadyClaimed();

      expect(error.code).toBe('REWARD_ALREADY_CLAIMED');
      expect(error.httpStatus).toBe(400);
    });

    it('activityNotActive - 400', () => {
      const error = Errors.activityNotActive();

      expect(error.code).toBe('ACTIVITY_NOT_ACTIVE');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('支付通道相关错误码', () => {
    it('noAvailableChannel - 503', () => {
      const error = Errors.noAvailableChannel();

      expect(error.code).toBe('NO_AVAILABLE_CHANNEL');
      expect(error.httpStatus).toBe(503);
    });

    it('channelUnavailable - 503', () => {
      const error = Errors.channelUnavailable();

      expect(error.code).toBe('CHANNEL_UNAVAILABLE');
      expect(error.httpStatus).toBe(503);
    });

    it('channelError - 502', () => {
      const error = Errors.channelError('网关超时');

      expect(error.code).toBe('CHANNEL_ERROR');
      expect(error.message).toBe('网关超时');
      expect(error.httpStatus).toBe(502);
    });
  });

  describe('黑名单相关错误码', () => {
    it('blacklistPhone - 403', () => {
      const error = Errors.blacklistPhone();

      expect(error.code).toBe('BLACKLIST_PHONE');
      expect(error.httpStatus).toBe(403);
    });

    it('blacklistIp - 403', () => {
      const error = Errors.blacklistIp();

      expect(error.code).toBe('BLACKLIST_IP');
      expect(error.httpStatus).toBe(403);
    });

    it('blacklistBankCard - 403', () => {
      const error = Errors.blacklistBankCard();

      expect(error.code).toBe('BLACKLIST_BANK_CARD');
      expect(error.httpStatus).toBe(403);
    });
  });

  describe('后台管理端错误码', () => {
    it('adminInvalidCredentials - 400', () => {
      const error = Errors.adminInvalidCredentials();

      expect(error.code).toBe('ADMIN_INVALID_CREDENTIALS');
      expect(error.httpStatus).toBe(400);
    });

    it('adminDisabled - 403', () => {
      const error = Errors.adminDisabled();

      expect(error.code).toBe('ADMIN_DISABLED');
      expect(error.httpStatus).toBe(403);
    });

    it('cannotDisableSelf - 400', () => {
      const error = Errors.cannotDisableSelf();

      expect(error.code).toBe('CANNOT_DISABLE_SELF');
      expect(error.httpStatus).toBe(400);
    });

    it('cannotModifySuperAdmin - 403', () => {
      const error = Errors.cannotModifySuperAdmin();

      expect(error.code).toBe('CANNOT_MODIFY_SUPER_ADMIN');
      expect(error.httpStatus).toBe(403);
    });
  });
});
