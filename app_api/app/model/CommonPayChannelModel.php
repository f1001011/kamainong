<?php

namespace app\model;

class CommonPayChannelModel extends BaseModel
{
    protected $name = 'common_pay_channel';

    const TYPE_RECHARGE = 1; // 充值渠道
    const TYPE_WITHDRAW = 2; // 提现渠道

    const STATUS_OFFLINE = 0; // 下架
    const STATUS_ONLINE = 1; // 上架
}
