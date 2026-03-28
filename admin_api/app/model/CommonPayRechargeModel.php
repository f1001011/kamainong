<?php

namespace app\model;

class CommonPayRechargeModel extends BaseModel
{
    protected $name = 'common_pay_recharge';

    const STATUS_CREATE = 0; // 创建订单
    const STATUS_WAIT_PAY = 1; // 待支付
    const STATUS_PAY_SUCCESS = 2; // 支付成功
    const STATUS_PAY_FAIL = 3; // 支付失败/拒绝
}
