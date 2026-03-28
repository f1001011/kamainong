<?php

namespace app\model;

class CommonRechargeVoucherModel extends BaseModel
{
    protected $name = 'common_recharge_voucher';

    const STATUS_PENDING = 0; // 待审核
    const STATUS_PASS = 1; // 审核通过
    const STATUS_REJECT = 2; // 审核拒绝
}
