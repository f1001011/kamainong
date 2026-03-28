<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ActivityValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',

        'daily_amount' => 'require|float|egt:0',
        'prize_1_amount' => 'require|float|egt:0',
        'prize_2_amount' => 'require|float|egt:0',
        'prize_3_amount' => 'require|float|egt:0',
        'draw_time' => ['require', 'regex' => '/^\d{2}:\d{2}$/'],

        'name' => 'require|max:100',
        'type' => 'require|in:1,2',
        'amount' => 'require|float|egt:0',
        'probability' => 'require|float|between:0,100',
        'image' => 'max:255',
        'status' => 'require|in:0,1',
    ];

    protected $message = [
        'id' => '10044',

        'daily_amount' => '10025',
        'prize_1_amount' => '10025',
        'prize_2_amount' => '10025',
        'prize_3_amount' => '10025',
        'draw_time' => '10025',

        'name' => '10026',
        'type' => '10025',
        'amount' => '10025',
        'probability' => '10025',
        'image' => '10025',
        'status' => '10025',
    ];

    protected $scene = [
        'prizePoolAdd' => ['daily_amount', 'prize_1_amount', 'prize_2_amount', 'prize_3_amount', 'draw_time'],
        'prizePoolUpdate' => ['id', 'daily_amount', 'prize_1_amount', 'prize_2_amount', 'prize_3_amount', 'draw_time'],
        'lotteryPrizeAdd' => ['name', 'type', 'amount', 'probability', 'image', 'status'],
        'lotteryPrizeUpdate' => ['id', 'name', 'type', 'amount', 'probability', 'image', 'status'],
        'lotteryPrizeDelete' => ['id'],
    ];
}
