<?php

namespace app\model;

class CommonWaresOrderModel extends BaseModel
{
    protected $name = 'common_wares_order';

    const STATUS_ORDERED = 0; // 下单
    const STATUS_DELIVERING = 1; // 发货中
    const STATUS_IN_TRANSIT = 2; // 运输中
    const STATUS_SIGNED = 3; // 签收
    const STATUS_REJECT_SIGN = 4; // 拒签
}
