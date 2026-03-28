<?php

namespace app\model;

class CommonGoodsModel extends BaseModel
{
    protected $name = 'common_goods';

    const STATUS_OFFLINE = 0; // 状态: 下架
    const STATUS_ONLINE = 1; // 状态: 上架
    const STATUS_COMING_SOON = 2; // 状态: 即将推出

    const RED_WAY_END_RETURN_ALL = 1; // 返利方式: 到期还本还息
    const RED_WAY_DAILY_INTEREST_END_PRINCIPAL = 2; // 返利方式: 每日返息到期还本

    const IS_EXAMINE_NO = 0; // 是否新手体验产品: 否
    const IS_EXAMINE_YES = 1; // 是否新手体验产品: 是

    const IS_COUPON_NO = 0; // 是否可用优惠券: 否
    const IS_COUPON_YES = 1; // 是否可用优惠券: 是

    const DEL_NO = 0; // 删除标记: 正常
    const DEL_YES = 1; // 删除标记: 删除
}
