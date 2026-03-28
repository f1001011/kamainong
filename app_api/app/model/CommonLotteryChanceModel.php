<?php

namespace app\model;

class CommonLotteryChanceModel extends BaseModel
{
    protected $name = 'common_lottery_chance';

    /**
     * 减少抽奖次数
     */
    public static function decChance($userId)
    {
        self::where('user_id', $userId)
            ->where('rest_chance', '>', 0)
            ->where('expire_time', '>=', date('Y-m-d H:i:s'))
            ->dec('rest_chance')
            ->inc('used_chance')
            ->update();
    }
}
