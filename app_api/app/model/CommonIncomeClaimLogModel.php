<?php

namespace app\model;

use think\facade\Db;

class CommonIncomeClaimLogModel extends BaseModel
{
    protected $name = 'common_income_claim_log';

    const STATUS_PENDING = 0; // 待领取
    const STATUS_CLAIMED = 1; // 已领取
    const STATUS_EXPIRED = 2; // 已过期

    const STATUS_USER_DAILY_INCOME = 103; // 用户每日收益

    /**
     * 获取订单待领取数量
     */
    public static function getPendingCount($orderId)
    {
        return self::where('order_id', $orderId)
            ->where('status', self::STATUS_PENDING)
            ->where('expire_time', '>=', date('Y-m-d H:i:s'))
            ->count();
    }

    /**
     * 获取用户所有待领取数量
     */
    public static function getUserTotalPendingCount($userId)
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_PENDING)
            ->where('expire_time', '>=', date('Y-m-d H:i:s'))
            ->count();
    }

    /**
     * 获取最近即将过期的待领取记录
     */
    public static function getNearestPendingClaim($userId)
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_PENDING)
            ->where('expire_time', '>=', date('Y-m-d H:i:s'))
            ->order('expire_time', 'asc')
            ->find();
    }

    /**
     * 批量获取用户即将过期的待领取记录
     */
    public static function getPendingClaimsExpiringSoon($userId, $limit = 10)
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_PENDING)
            ->where('expire_time', '>=', date('Y-m-d H:i:s'))
            ->order('expire_time', 'asc')
            ->limit($limit)
            ->select();
    }

    /**
     * 领取收益（单条）
     */
    public static function claim($claimLog, $userId)
    {
        Db::startTrans();
        try {
            $now = date('Y-m-d H:i:s');

            $claimLog->save([
                'status' => self::STATUS_CLAIMED,
                'claim_time' => $now,
            ]);

            Db::commit();
            return true;
        } catch (\Throwable $e) {
            Db::rollback();
            return false;
        }
    }
}
