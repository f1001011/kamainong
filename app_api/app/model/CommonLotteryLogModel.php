<?php

namespace app\model;

class CommonLotteryLogModel extends BaseModel
{
    protected $name = 'common_lottery_log';

    /**
     * 记录抽奖结果
     */
    public static function recordPrize($userId, $prizeId, $prizeName, $prizeType, $amount)
    {
        $model = new self();
        $model->save([
            'user_id' => $userId,
            'prize_id' => $prizeId,
            'prize_name' => $prizeName,
            'prize_type' => $prizeType,
            'amount' => $amount,
            'create_time' => date('Y-m-d H:i:s'),
        ]);
        return $model;
    }
}
