<?php

namespace app\model;

class CommonIncomeClaimLogModel extends BaseModel
{
    protected $name = 'common_income_claim_log';

    const STATUS_PENDING = 0; // 待领取
    const STATUS_CLAIMED = 1; // 已领取
    const STATUS_EXPIRED = 2; // 已过期
}
