<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class UserValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',
        'user_name' => 'max:30',
        'phone' => 'max:20',
        'nickname' => 'max:30',
        'level_vip' => 'integer|egt:0',
        'pwd' => 'min:1|max:50',
        'status' => 'require|in:0,1',
        'state' => 'require|in:0,1',
        'action' => 'require|in:inc,dec',
        'amount' => 'require|float|gt:0',
    ];

    protected $message = [
        'id' => '10044',
        'user_name' => '10026',
        'phone' => '10027',
        'nickname' => '10026',
        'level_vip' => '10025',
        'pwd' => '10021',
        'status' => '10025',
        'state' => '10025',
        'action' => '10025',
        'amount' => '10025',
    ];

    protected $scene = [
        'updateBase' => ['id', 'user_name', 'phone', 'nickname', 'level_vip', 'pwd'],
        'updateStatus' => ['id', 'status'],
        'updateState' => ['id', 'state'],
        'updateBalance' => ['id', 'action', 'amount'],
        'updateIntegral' => ['id', 'action', 'amount'],
    ];
}
