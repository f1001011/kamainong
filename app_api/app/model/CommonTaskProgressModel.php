<?php

namespace app\model;

class CommonTaskProgressModel extends BaseModel
{
    protected $name = 'common_task_progress';

    const IS_COMPLETED_NO = 0; // 未完成
    const IS_COMPLETED_YES = 1; // 已完成

    const IS_CLAIMED_NO = 0; // 未领取
    const IS_CLAIMED_YES = 1; // 已领取
}
