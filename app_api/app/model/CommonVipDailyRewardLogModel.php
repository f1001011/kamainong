<?php

namespace app\model;

class CommonVipDailyRewardLogModel extends BaseModel
{
    protected $name = 'common_vip_daily_reward_log';

    /**
     * 查询用户今天是否已领取VIP每日奖励
     */
    public static function getTodayClaim($userId, $claimDate)
    {
        return self::where('user_id', $userId)
            ->where('claim_date', $claimDate)
            ->find();
    }

    /**
     * 创建VIP每日奖励领取记录
     */
    public static function createClaimLog($userId, $vipLevel, $rewardAmount, $claimDate)
    {
        $model = new self();
        $model->save([
            'user_id' => $userId,
            'vip_level' => $vipLevel,
            'reward_amount' => $rewardAmount,
            'claim_date' => $claimDate,
            'create_time' => date('Y-m-d H:i:s'),
        ]);

        return $model;
    }
}
