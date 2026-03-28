<?php

namespace app\model;

class CommonLotteryPrizeModel extends BaseModel
{
    protected $name = 'common_lottery_prize';

    const TYPE_CASH = 1; // 奖品类型: 现金
    const TYPE_PHYSICAL = 2; // 奖品类型: 实物

    const STATUS_DISABLE = 0; // 状态: 禁用
    const STATUS_ENABLE = 1; // 状态: 启用
}
