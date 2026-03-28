<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ProductValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',

        'goods_type_id' => 'integer|gt:0',
        'goods_name' => 'max:50',
        'goods_money' => 'float|egt:0',
        'project_scale' => 'float|egt:0',
        'day_red' => 'float|egt:0',
        'income_times_per_day' => 'integer|egt:1',
        'income_per_time' => 'float|egt:0',
        'total_money' => 'float|egt:0',
        'revenue_lv' => 'float|egt:0',
        'period' => 'integer|egt:0',
        'status' => 'in:0,1,2',
        'red_way' => 'in:1,2',
        'warrant' => 'max:50',
        'is_examine' => 'in:0,1',
        'sort' => 'integer|egt:0',
        'is_coupon' => 'in:0,1',
        'progress_rate' => 'float|egt:0',
        'goods_agent_1' => 'float|egt:0',
        'goods_agent_2' => 'float|egt:0',
        'goods_agent_3' => 'float|egt:0',
        'buy_num' => 'integer|egt:0',
        'level_vip' => 'integer|egt:0',
        'minute_claim' => 'integer|egt:0',

        'wares_type_id' => 'integer|gt:0',
        'wares_name' => 'max:255',
        'wares_money' => 'float|egt:0',
        'wares_spec' => 'max:255',
        'content' => 'max:65535',
        'wares_status' => 'in:0,1',
        'wares_sort' => 'integer|egt:0',
        'is_type' => 'integer|egt:0',
    ];

    protected $message = [
        'id' => '10044',

        'goods_type_id' => '10025',
        'goods_name' => '10026',
        'goods_money' => '10025',
        'project_scale' => '10025',
        'day_red' => '10025',
        'income_times_per_day' => '10025',
        'income_per_time' => '10025',
        'total_money' => '10025',
        'revenue_lv' => '10025',
        'period' => '10025',
        'status' => '10025',
        'red_way' => '10025',
        'warrant' => '10026',
        'is_examine' => '10025',
        'sort' => '10025',
        'is_coupon' => '10025',
        'progress_rate' => '10025',
        'goods_agent_1' => '10025',
        'goods_agent_2' => '10025',
        'goods_agent_3' => '10025',
        'buy_num' => '10025',
        'level_vip' => '10025',
        'minute_claim' => '10025',

        'wares_type_id' => '10025',
        'wares_name' => '10026',
        'wares_money' => '10025',
        'wares_spec' => '10025',
        'content' => '10025',
        'wares_status' => '10025',
        'wares_sort' => '10025',
        'is_type' => '10025',
    ];

    protected $scene = [
        'goodsAdd' => [
            'goods_type_id', 'goods_name', 'goods_money', 'project_scale', 'day_red',
            'income_times_per_day', 'income_per_time', 'total_money', 'revenue_lv',
            'period', 'status', 'red_way', 'warrant', 'is_examine', 'sort',
            'is_coupon', 'progress_rate', 'goods_agent_1', 'goods_agent_2',
            'goods_agent_3', 'buy_num', 'level_vip', 'minute_claim',
        ],
        'goodsUpdate' => [
            'id', 'goods_type_id', 'goods_name', 'goods_money', 'project_scale', 'day_red',
            'income_times_per_day', 'income_per_time', 'total_money', 'revenue_lv',
            'period', 'status', 'red_way', 'warrant', 'is_examine', 'sort',
            'is_coupon', 'progress_rate', 'goods_agent_1', 'goods_agent_2',
            'goods_agent_3', 'buy_num', 'level_vip', 'minute_claim',
        ],
        'goodsDelete' => ['id'],
        'waresAdd' => ['wares_type_id', 'wares_name', 'wares_money', 'wares_spec', 'content', 'wares_status', 'wares_sort', 'is_type'],
        'waresUpdate' => ['id', 'wares_type_id', 'wares_name', 'wares_money', 'wares_spec', 'content', 'wares_status', 'wares_sort', 'is_type'],
        'waresDelete' => ['id'],
    ];
}
