<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class TaskValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',
        'task_group' => 'require|in:1,2',
        'task_name' => 'require|max:100',
        'required_invites' => 'require|integer|gt:0',
        'invite_level' => 'require|in:LV1,LV2',
        'reward_amount' => 'require|float|egt:0',
        'sort' => 'require|integer|egt:0',
        'status' => 'require|in:0,1',
    ];

    protected $message = [
        'id' => '10044',
        'task_group' => '10025',
        'task_name' => '10026',
        'required_invites' => '10025',
        'invite_level' => '10025',
        'reward_amount' => '10025',
        'sort' => '10025',
        'status' => '10025',
    ];

    protected $scene = [
        'configAdd' => ['task_group', 'task_name', 'required_invites', 'invite_level', 'reward_amount', 'sort', 'status'],
        'configUpdate' => ['id', 'task_group', 'task_name', 'required_invites', 'invite_level', 'reward_amount', 'sort', 'status'],
        'configDelete' => ['id'],
    ];
}
