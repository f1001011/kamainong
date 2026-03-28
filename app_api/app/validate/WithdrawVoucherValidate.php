<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class WithdrawVoucherValidate extends Validate
{
    protected $rule = [
        'withdraw_id' => 'require|integer|gt:0',
    ];

    protected $message = [
        'withdraw_id' => '10137',
    ];

    protected $scene = [
        'upload' => ['withdraw_id'],
    ];
}
