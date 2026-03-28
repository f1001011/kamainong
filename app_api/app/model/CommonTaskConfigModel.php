<?php

namespace app\model;

class CommonTaskConfigModel extends BaseModel
{
    protected $name = 'common_task_config';

    const TASK_GROUP_LV2_INVITE = 1; // LV2 邀请任务组
    const TASK_GROUP_LV1_INVITE = 2; // LV1 邀请任务组

    const STATUS_DISABLE = 0; // 禁用
    const STATUS_ENABLE = 1; // 启用
}
