<?php

namespace app\model;

class CommonPayCashModel extends BaseModel
{
    protected $name = 'common_pay_cash';

    const STATUS_APPLY = 0; // 申请提现
    const STATUS_SUCCESS = 1; // 打款成功
    const STATUS_REJECT = 2; // 提现拒绝

    const IS_STATUS_INIT = 0; // 未提交到平台
    const IS_STATUS_SUBMIT_PLATFORM = 1; // 已提交到平台
}
