<?php

namespace app\model;

class CommonPayCouponModel extends BaseModel
{
    protected $name = 'common_pay_coupon';

    const TYPE_PAY = 1; // 支付优惠券

    const STATUS_USED = 1; // 已使用
    const STATUS_UNUSED = 2; // 未使用
}
