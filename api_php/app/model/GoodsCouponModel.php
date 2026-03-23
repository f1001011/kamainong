<?php

namespace app\model;


class GoodsCouponModel extends BaseModel
{
    public $name = 'common_goods_coupon';

    public static function getTimeOne($map = [],$effect_time = ''){
        return self::where($map)->whereTime('effect_time','<=',$effect_time)->find();
    }
}