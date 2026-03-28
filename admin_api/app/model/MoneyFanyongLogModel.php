<?php

namespace app\model;

class MoneyFanyongLogModel extends BaseModel
{
    protected $name = 'money_fanyong_log';

    const MONEY_TYPE_LEVEL_1 = 1; // 一级直推返佣
    const MONEY_TYPE_LEVEL_2 = 2; // 二级直推返佣
    const MONEY_TYPE_LEVEL_3 = 3; // 三级直推返佣

    const IS_ADD_TO_USER_ACCOUNT_NO = 0; // 未添加到账户
    const IS_ADD_TO_USER_ACCOUNT_YES = 1; // 已添加到账户
}
