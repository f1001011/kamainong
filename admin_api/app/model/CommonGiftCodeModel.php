<?php

namespace app\model;

class CommonGiftCodeModel extends BaseModel
{
    protected $name = 'common_gift_code';

    const TYPE_BALANCE = 1; // 礼品码类型: 余额

    const STATUS_DISABLE = 0; // 状态: 禁用
    const STATUS_ENABLE = 1; // 状态: 启用
}
