<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class SysConfigValidate extends Validate
{
    protected $rule = [
        'id' => 'require|integer|gt:0',
        'name' => 'max:200',
        'mark' => 'max:200',
    ];

    protected $message = [
        'id' => '10044',
        'name' => '10026',
        'mark' => '10025',
    ];

    protected $scene = [
        'add' => ['name', 'mark'],
        'update' => ['id', 'name', 'mark'],
    ];
}
