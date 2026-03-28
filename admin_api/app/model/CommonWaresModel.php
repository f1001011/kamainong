<?php

namespace app\model;

class CommonWaresModel extends BaseModel
{
    protected $name = 'common_wares';

    const STATUS_OFFLINE = 0; // 下架
    const STATUS_ONLINE = 1; // 上架

    const IS_TYPE_INTEGRAL_EXCHANGE = 1; // 积分兑换类型
}
