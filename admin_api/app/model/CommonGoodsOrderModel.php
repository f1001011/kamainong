<?php

namespace app\model;

class CommonGoodsOrderModel extends BaseModel
{
    protected $name = 'common_goods_order';

    const IS_COUPON_NO = 0; // 未使用优惠券

    const STATUS_NORMAL = 0; // 正常分红中
    const STATUS_REBATE_FINISHED = 1; // 返佣完成
    const STATUS_DIVIDEND_FINISHED = 2; // 分红完成利息返回完成
    const STATUS_PRINCIPAL_FINISHED = 3; // 本金返回完成
    const STATUS_DELETE = -1; // 逻辑删除
}
