<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class PaymentValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',

        'status' => 'integer',
        'money' => 'float|egt:0',
        'actual_amount' => 'float|egt:0',
        'fee' => 'float|egt:0',
        'channel_id' => 'integer|gt:0',
        'order_no' => 'max:200',
        'order_on' => 'max:200',
        'sys_bank_id' => 'max:200',
        'u_bank_name' => 'max:200',
        'u_bank_user_name' => 'max:200',
        'u_bank_card' => 'max:200',
        'u_back_card' => 'max:200',
        'u_back_user_name' => 'max:200',
        'reject_reason' => 'max:255',
        'trilateral_order' => 'max:200',
        'channel_name' => 'max:100',
        'pay_type' => 'max:200',
        'msg' => 'max:200',
        'image_url' => 'max:65535',
        'expire_at' => 'max:30',
        'success_time' => 'max:30',
        'is_status' => 'in:0,1',

        'type' => 'in:1,2',
        'name' => 'max:100',
        'json_value' => 'max:65535',
        'channel_status' => 'in:0,1',
    ];

    protected $message = [
        'id' => '10044',

        'status' => '10025',
        'money' => '10025',
        'actual_amount' => '10025',
        'fee' => '10025',
        'channel_id' => '10025',
        'order_no' => '10025',
        'order_on' => '10025',
        'sys_bank_id' => '10025',
        'u_bank_name' => '10026',
        'u_bank_user_name' => '10026',
        'u_bank_card' => '10025',
        'u_back_card' => '10025',
        'u_back_user_name' => '10026',
        'reject_reason' => '10025',
        'trilateral_order' => '10025',
        'channel_name' => '10026',
        'pay_type' => '10026',
        'msg' => '10025',
        'image_url' => '10025',
        'expire_at' => '10025',
        'success_time' => '10025',
        'is_status' => '10025',

        'type' => '10025',
        'name' => '10026',
        'json_value' => '10025',
        'channel_status' => '10025',
    ];

    protected $scene = [
        'rechargeUpdate' => [
            'id', 'status', 'money', 'actual_amount', 'channel_id', 'order_no',
            'sys_bank_id', 'u_bank_name', 'u_bank_user_name', 'u_bank_card',
            'reject_reason', 'trilateral_order', 'channel_name', 'image_url',
            'expire_at', 'success_time',
        ],
        'cashUpdate' => [
            'id', 'status', 'money', 'fee', 'actual_amount', 'channel_id',
            'order_on', 'pay_type', 'u_bank_name', 'u_back_card',
            'u_back_user_name', 'reject_reason', 'trilateral_order',
            'channel_name', 'success_time', 'msg', 'is_status',
        ],
        'channelAdd' => ['type', 'name', 'json_value', 'channel_status'],
        'channelUpdate' => ['id', 'type', 'name', 'json_value', 'channel_status'],
        'channelDelete' => ['id'],
    ];
}
