<?php

/**
 * 系统状态常量定义
 * 集中管理所有状态值，便于维护和查找
 */

namespace app\consts;

/**
 * 收益领取状态
 */
class IncomeStatus
{
    const WAITING = 0;      // 待领取（可领取）
    const CLAIMED = 1;      // 已领取
    const EXPIRED = 2;      // 已过期
}

/**
 * 订单状态
 */
class OrderStatus
{
    const PENDING = 0;      // 待支付
    const ACTIVE = 1;       // 进行中
    const COMPLETED = 2;    // 已完成
    const CANCELLED = 3;   // 已取消
}

/**
 * 充值状态
 */
class RechargeStatus
{
    const PENDING = 0;      // 待支付
    const PAID = 1;        // 已支付
    const CANCELLED = 2;   // 已取消
}

/**
 * 提现状态
 */
class WithdrawStatus
{
    const PENDING = 0;      // 待处理
    const APPROVED = 1;     // 已通过
    const REJECTED = 2;     // 已拒绝
}

/**
 * VIP奖励状态
 */
class VipRewardStatus
{
    const UNCLAIMED = 0;    // 未领取
    const CLAIMED = 1;      // 已领取
    const EXPIRED = 2;     // 已过期
}

/**
 * 奖池状态
 */
class PrizeStatus
{
    const UNCLAIMED = 0;    // 未领取
    const CLAIMED = 1;     // 已领取
}

/**
 * 任务状态
 */
class TaskStatus
{
    const IN_PROGRESS = 0;  // 进行中
    const COMPLETED = 1;    // 已完成
}

/**
 * 通知类型
 */
class NotificationType
{
    const SYSTEM = 'system';        // 系统通知
    const TRANSACTION = 'transaction'; // 交易通知
}
