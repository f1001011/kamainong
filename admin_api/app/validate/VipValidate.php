<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class VipValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',

        'vip' => 'require|integer|gt:0',
        'experience' => 'require|integer|egt:0',
        'reward_money' => 'require|float|egt:0',
        'buy_goods_id' => 'require|integer|egt:0',
        'buy_goods_num' => 'require|integer|egt:0',

        'level' => 'require|integer|gt:0',
        'level_name' => 'require|max:50',
        'required_members' => 'require|integer|egt:0',
        'member_type' => 'require|in:LV1,LV123',
        'reward_amount' => 'require|float|egt:0',
    ];

    protected $message = [
        'id' => '10044',

        'vip' => '10025',
        'experience' => '10025',
        'reward_money' => '10025',
        'buy_goods_id' => '10025',
        'buy_goods_num' => '10025',

        'level' => '10025',
        'level_name' => '10026',
        'required_members' => '10025',
        'member_type' => '10025',
        'reward_amount' => '10025',
    ];

    protected $scene = [
        'vipAdd' => ['vip', 'experience', 'reward_money', 'buy_goods_id', 'buy_goods_num'],
        'vipUpdate' => ['id', 'vip', 'experience', 'reward_money', 'buy_goods_id', 'buy_goods_num'],
        'vipDelete' => ['id'],
        'agentAdd' => ['level', 'level_name', 'required_members', 'member_type', 'reward_amount'],
        'agentUpdate' => ['id', 'level', 'level_name', 'required_members', 'member_type', 'reward_amount'],
        'agentDelete' => ['id'],
    ];
}
